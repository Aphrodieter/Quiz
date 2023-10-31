var password = "1benis";
(function passcodeprotect() {
   var passcode = prompt("Enter PassCode");
   while (passcode !== password) {
      alert("Incorrect PassCode");
      return passcodeprotect();
   }
}());
