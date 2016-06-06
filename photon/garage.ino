int pin = D7;
int sensor = D0;

int DOOR_OPEN = 0;
int DOOR_CLOSED = 1;


int initialState;
int doorState = DOOR_CLOSED;
int lastDoorState = doorState;

void setup() {
  Particle.function("toggle", togglePin);
  Particle.variable("doorState", &doorState, INT);
  Particle.variable("initialState", &initialState, INT);
  pinMode(pin, OUTPUT);
  pinMode(sensor, INPUT_PULLDOWN);
  int initialState = digitalRead(sensor);
  Particle.publish("garage-door-initialize", String(initialState), 60, PRIVATE);

}

void loop() {
    int doorPinState = digitalRead(sensor);

    if (doorPinState == LOW) {
        doorState = DOOR_OPEN;
    } else if (doorPinState == HIGH) {
        doorState = DOOR_CLOSED;
    }

    if (doorState != lastDoorState) {
        Particle.publish("garage-door-state-change", String(doorState), 60, PRIVATE);
    }
    lastDoorState = doorState;
}

int togglePin(String command) {
    digitalWrite(pin, HIGH);
    delay(1000);
    digitalWrite(pin, LOW);
    Particle.publish("garage-door-toggled", PRIVATE);
    return 0;
}
