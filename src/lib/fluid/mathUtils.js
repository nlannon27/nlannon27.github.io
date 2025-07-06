import { gridSize, numSolverPasses, renderScale } from './fluid.js'

/**
    Compute the 1D array index from 2D grid coordinates
    x : x coordinate
    y : y coordinate
 */
function cellIndex(x, y) {
    return x + y * gridSize
}

/*
    diffuseField(boundaryType, field, sourceField, diffusionRate, timeStep)
    Spread the quantity in sourceField into field over timeStep.
    Uses an implicit scheme for stability.
    boundaryType : 0 for density, 1 or 2 for velocity components
    field        : array to receive new values
    sourceField  : array of old values
    diffusionRate: how fast the quantity spreads
    timeStep     : time increment
*/
function diffuseField(boundaryType, field, sourceField, diffusionRate, timeStep) {
    // a scales the influence of neighbor cells
    const a = timeStep * diffusionRate * (gridSize - 2) * (gridSize - 2)
    const c = 1 + 6 * a
    solveLinearSystem(boundaryType, field, sourceField, a, c)
}

/*
    solveLinearSystem(boundaryType, x, x0, a, c)
    Solve x = (x0 + a * sum(neighbors of x)) / c by Gauss–Seidel iteration.
    boundaryType: passed to applyBoundary
    x           : array we solve for
    x0          : right hand side array
    a, c        : discretization coefficients
*/
function solveLinearSystem(boundaryType, x, x0, a, c) {
    const cRecip = 1 / c

    for (let pass = 0; pass < numSolverPasses; pass++) {
        // update interior cells only
        for (let row = 1; row < gridSize - 1; row++) {
            for (let col = 1; col < gridSize - 1; col++) {
                const idx = cellIndex(col, row)
                const sumNeighbors =
                    x[cellIndex(col + 1, row)] +
                    x[cellIndex(col - 1, row)] +
                    x[cellIndex(col, row + 1)] +
                    x[cellIndex(col, row - 1)]

                x[idx] = (x0[idx] + a * sumNeighbors) * cRecip
            }
        }
        applyBoundary(boundaryType, x)
    }
}

/*
    enforceIncompressibility(velX, velY, pressure, divergence)
    Make the velocity field divergence free (zero net flow per cell).
    Steps:
        1) compute divergence from velX and velY
        2) solve Poisson eqn for pressure
        3) subtract pressure gradient from velocity
    velX       : x component of velocity array
    velY       : y component of velocity array
    pressure   : temporary array for pressure
    divergence : temporary array for divergence
*/
function enforceIncompressibility(velX, velY, pressure, divergence) {
    // compute divergence at each interior cell
    for (let y = 1; y < gridSize - 1; y++) {
        for (let x = 1; x < gridSize - 1; x++) {
            const idx = cellIndex(x, y)
            divergence[idx] = (
                -0.5 * (
                    velX[cellIndex(x + 1, y)] - velX[cellIndex(x - 1, y)] +
                    velY[cellIndex(x, y + 1)] - velY[cellIndex(x, y - 1)]
                )
            ) / gridSize
            pressure[idx] = 0
        }
    }

    applyBoundary(0, divergence)
    applyBoundary(0, pressure)
    solveLinearSystem(0, pressure, divergence, 1, 6)

    // subtract pressure gradient to correct velocity
    for (let y = 1; y < gridSize - 1; y++) {
        for (let x = 1; x < gridSize - 1; x++) {
            const idx = cellIndex(x, y)
            velX[idx] -= 0.5 * (pressure[cellIndex(x + 1, y)] - pressure[cellIndex(x - 1, y)]) * gridSize
            velY[idx] -= 0.5 * (pressure[cellIndex(x, y + 1)] - pressure[cellIndex(x, y - 1)]) * gridSize
        }
    }

    applyBoundary(1, velX)
    applyBoundary(2, velY)
}

/*
    advectField(boundaryType, destField, sourceField, velX, velY, timeStep)
    Transport sourceField through the velocity field velX, velY.
    Uses semi-Lagrangian backtrace for stability.
    boundaryType: passed to applyBoundary
    destField    : receives advected values
    sourceField  : values before advection
    velX, velY   : velocity components
    timeStep     : time increment
*/
function advectField(boundaryType, destField, sourceField, velX, velY, timeStep) {
    const scale = gridSize - 2
    const dtx = timeStep * scale
    const dty = timeStep * scale

    for (let y = 1; y < gridSize - 1; y++) {
        for (let x = 1; x < gridSize - 1; x++) {
            // backtrace position
            let posX = x - dtx * velX[cellIndex(x, y)]
            let posY = y - dty * velY[cellIndex(x, y)]
            // clamp inside valid range
            posX = Math.min(Math.max(posX, 0.5), scale + 0.5)
            posY = Math.min(Math.max(posY, 0.5), scale + 0.5)

            // compute surrounding cell indices
            const i0 = Math.floor(posX)
            const i1 = i0 + 1
            const j0 = Math.floor(posY)
            const j1 = j0 + 1

            // weights for bilinear interpolation
            const s1 = posX - i0
            const s0 = 1 - s1
            const t1 = posY - j0
            const t0 = 1 - t1

            // sample sourceField at corners
            const idxI0J0 = sourceField[cellIndex(i0, j0)]
            const idxI0J1 = sourceField[cellIndex(i0, j1)]
            const idxI1J0 = sourceField[cellIndex(i1, j0)]
            const idxI1J1 = sourceField[cellIndex(i1, j1)]

            // bilinear interpolation
            destField[cellIndex(x, y)] =
                s0 * (t0 * idxI0J0 + t1 * idxI0J1) +
                s1 * (t0 * idxI1J0 + t1 * idxI1J1)
        }
    }

    applyBoundary(boundaryType, destField)
}

/*
  applyBoundary(boundaryType, field)
  Enforce boundary conditions at the edges of the grid.
  For velocity fields we invert the normal component.
  For scalar fields we copy the nearest interior value.
*/
function applyBoundary(boundaryType, field) {
    for (let i = 1; i < gridSize - 1; i++) {
        // top and bottom edges
        field[cellIndex(i, 0)] = boundaryType === 2 ? -field[cellIndex(i, 1)] : field[cellIndex(i, 1)]
        field[cellIndex(i, gridSize - 1)] = boundaryType === 2 ? -field[cellIndex(i, gridSize - 2)] : field[cellIndex(i, gridSize - 2)]
    }
    for (let j = 1; j < gridSize - 1; j++) {
        // left and right edges
        field[cellIndex(0, j)] = boundaryType === 1 ? -field[cellIndex(1, j)] : field[cellIndex(1, j)]
        field[cellIndex(gridSize - 1, j)] = boundaryType === 1 ? -field[cellIndex(gridSize - 2, j)] : field[cellIndex(gridSize - 2, j)]
    }
    // corners set to average of two adjacent edges
    field[cellIndex(0, 0)] = 0.5 * (field[cellIndex(1, 0)] + field[cellIndex(0, 1)])
    field[cellIndex(0, gridSize - 1)] = 0.5 * (field[cellIndex(1, gridSize - 1)] + field[cellIndex(0, gridSize - 2)])
    field[cellIndex(gridSize - 1, 0)] = 0.5 * (field[cellIndex(gridSize - 2, 0)] + field[cellIndex(gridSize - 1, 1)])
    field[cellIndex(gridSize - 1, gridSize - 1)] = 0.5 * (field[cellIndex(gridSize - 2, gridSize - 1)] + field[cellIndex(gridSize - 1, gridSize - 2)])
}

export { cellIndex, diffuseField, enforceIncompressibility, advectField };