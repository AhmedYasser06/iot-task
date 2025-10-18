#include <ESP8266WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

const char* ssid = "ahmed";
const char* password = " AhmeD2004@#  ";

WebSocketsClient webSocket;
const char* serverIP = "192.168.1.35"; 
const int serverPort = 3000;

const int ledPin = D5;

void setupWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\nConnected to WiFi");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED: {
      Serial.println("Disconnected from server");
      break;
    }
    
    case WStype_CONNECTED: {
      Serial.println("Connected to WebSocket server");
      break;
    }
    
    case WStype_TEXT: {
      Serial.printf("Received: %s\n", payload);
      
      StaticJsonDocument<200> doc;
      DeserializationError error = deserializeJson(doc, payload);
      
      if (error) {
        Serial.print("JSON parsing failed: ");
        Serial.println(error.c_str());
        return;
      }
      
      const char* msgType = doc["type"];
      
      if (msgType && strcmp(msgType, "rangeUpdate") == 0) {
        int value = doc["value"]; 
        
        analogWrite(ledPin, value);
        
        Serial.print("LED Brightness: ");
        Serial.println(value);
      }
      break;
    }
    
    default: {
      break;
    }
  }
}

void setupWebSocket() {
  webSocket.begin(serverIP, serverPort, "/");
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000);
  
  Serial.println("WebSocket client initialized");
}

void setup() {
  Serial.begin(115200);
  delay(100);
  
  Serial.println("\n\nESP8266 WebSocket LED Controller");
  Serial.println("=====================================");
  
  pinMode(ledPin, OUTPUT);
  analogWrite(ledPin, 0);
  
  setupWiFi();
  setupWebSocket();
}

void loop() {
  webSocket.loop();
}