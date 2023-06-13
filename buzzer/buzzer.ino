#include <Keyboard.h>

const int buttonPin = 7;     // the number of the pushbutton pin
const int buttonPin2 = 9;     // the number of the pushbutton pin
const int ledPin =  13;      // the number of the LED pin

// variables will change:
int buttonState = 0;         // variable for reading the pushbutton status
int buttonState2 = 0;         // variable for reading the pushbutton status

void setup() {
  // initialize the pushbutton pin as an input:
  pinMode(buttonPin, INPUT_PULLUP);
  pinMode(buttonPin2, INPUT_PULLUP);
  Keyboard.begin();
}

void loop() {
  // read the state of the pushbutton value:
  buttonState = digitalRead(buttonPin);
  buttonState2 = digitalRead(buttonPin2);

  if (buttonState == LOW) {
    Keyboard.press('a');
  } else {
    Keyboard.release('a');
  };

  if (buttonState2 == LOW) {
    Keyboard.press('b');
  } else {
    Keyboard.release('b');
  };
}
