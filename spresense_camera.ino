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

  // より高解像度JPEG用設定（JPEGバッファサイズを最大に）
  CamErr err = theCamera.setStillPictureImageFormat(
      1280, // 幅 (HD解像度)
      960,  // 高さ (HD解像度)
      CAM_IMAGE_PIX_FMT_JPG, // フォーマット
      2 // jpgbufsize_divisor (さらに大きなバッファ)
  ); 
  
  if (err != CAM_ERR_SUCCESS) {
    Serial.print("Spresense: ERROR - setStillPictureImageFormat failed: ");
    Serial.println(err);
    Serial.println("Spresense: Trying with smaller resolution...");
    
    // フォールバック: より小さい解像度で再試行
    err = theCamera.setStillPictureImageFormat(640, 480, CAM_IMAGE_PIX_FMT_JPG, 2);
    if (err != CAM_ERR_SUCCESS) {
      Serial.println("Spresense: ERROR - Even fallback resolution failed!");
      while(1);
    }
    Serial.println("Spresense: Using fallback resolution 640x480");
  }

  // JPEG品質を最高に設定
  theCamera.setJPEGQuality(100); // 最高品質
  
  Serial.println("Spresense: Camera ready with HD quality. Starting capture loop...");
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

  delay(15000); // 15秒間隔（HD画像送信時間考慮） 
}
