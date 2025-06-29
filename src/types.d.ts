export interface TimelineItem {
  title?: string;
  subtitle?: string;
  period?: string;
  stack?: string[];
  description?: string;
  icon?: string;
}

export interface ImageTimelineItem {
  title?: string;
  subtitle?: string;
  period?: string;
  description?: string;
  image?: string;
}

export interface Steps {
  title: string;
  items: Item[];
  image?: string | Record<string, unknown>;
  isReversed?: boolean;
  id?: string;
}

export interface Skill {
  order: number;
  name: string;
  key: string;
  img: string;
}

export interface AboutData {
  description: string;
  skills: Skill[];
}
