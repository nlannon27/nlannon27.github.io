$(document).ready(function() {
    $(window).scroll( function(){
        $('.fadescroll').each( function(i){
            if($(this).parent().parent().css('display') == 'none') return;

            var objLimit = $(this).position().top + ($(this).outerHeight()/4);
            var winLimit = $(window).scrollTop() + $(window).height();

            if(winLimit > objLimit) {   
                if($(this).is(':animated')) return;
                
                $(this).animate({
                    'opacity':'1'
                }, {duration: 500, queue: true}); 
            }
        });
    });

    window.onbeforeunload = function () {
        window.scrollTo(0, 0);
    }
});