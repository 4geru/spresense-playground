#include <Camera.h>
#include <HardwareSerial.h> 

// --- 設定値 ---
#define BAUD_RATE 115200 
const char* START_MARKER = "START_JPEG";
const char* END_MARKER = "END_JPEG";

void setup() {
  Serial.begin(BAUD_RATE);
  while (!Serial); 
  Serial.println("Spresense: System initializing...");

  if (theCamera.begin() != CAM_ERR_SUCCESS) { 
    Serial.println("Spresense: Camera initialize failed.");
    while(1);
  }

  theCamera.setStillPictureImageFormat(
      320, // 幅 (QVGA)
      240, // 高さ (QVGA)
      CAM_IMAGE_PIX_FMT_JPG, // フォーマット
      1 // 撮影枚数
  ); 

  Serial.println("Spresense: Camera ready. Starting capture loop...");
}

void loop() {
  CamImage img = theCamera.takePicture(); 
  
  if (img.isAvailable()) { 
    
    // 正しいCamImageのメンバー関数を使用
    const uint8_t* image_buffer = (const uint8_t*)img.getImgBuff();
    
    // 正しいサイズ取得メソッド
    size_t actual_size = img.getImgSize();        

    Serial.print("Spresense: Picture taken. Size: ");
    Serial.print(actual_size);
    Serial.println(" bytes.");

    Serial.print(START_MARKER);
    Serial.write(image_buffer, actual_size);
    Serial.println(END_MARKER);

    Serial.println("Spresense: Data sent to Mac.");
  } else {
    Serial.println("Spresense: Failed to take picture or image not available.");
  }

  delay(5000); 
}
