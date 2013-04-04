(function($) {
  $(document).ready(function(){
    // Menu Click Animation
    $('#menu .section-container p').click(function(){
      $(this).parent().toggleClass('active').siblings().removeClass('active').find('.content').slideUp();
      $(this).next('.content').slideToggle();
    });
    
    $('#toolbar h1, #toolbar .right a').click(function(){
	    $('.toggle-topbar').trigger('click');
    });
    
  });
  
})(jQuery);