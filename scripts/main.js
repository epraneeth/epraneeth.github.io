function myFunction() {
    var x = document.getElementsById("sid");
    if (x.className === "sbox") {
      x.className += " responsive";
    } else {
      x.className = "sbox";
    }
  }