// Convert bytes to a kb and Mb
function convertSize(bytes) {
  if(bytes < 1024)
    return bytes + ' bytes';
  else {
    kb = (bytes * 1.0)/1024.0;
    if(kb < 1024)
      return kb.toFixed(2) + ' kb';
    else
      return (kb/1024.0).toFixed(2) + ' Mb';
  }
}


// Smooth scroll to target
function smoothScroll(target) {
  if (target.length) {
    $('html,body').animate({
      scrollTop: target.offset().top
    }, 1000);
    return false;
  }
}

// Replace '.' with '-' since jQuery doesn't play nice with periods in ids
function createSafeID(string) {
  return string.replace(/\./g, '-');
}