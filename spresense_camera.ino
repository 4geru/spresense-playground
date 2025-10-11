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

  // 最大解像度JPEG用設定（JPEGバッファサイズを最大に）
  CamErr err = theCamera.setStillPictureImageFormat(
      1920, // 幅 (Full HD)
      1080, // 高さ (Full HD)
      CAM_IMAGE_PIX_FMT_JPG, // フォーマット
      1 // jpgbufsize_divisor (最大バッファサイズ)
  ); 
  
  if (err != CAM_ERR_SUCCESS) {
    Serial.print("Spresense: ERROR - setStillPictureImageFormat failed: ");
    Serial.println(err);
    Serial.println("Spresense: Trying with smaller resolution...");
    
    // フォールバック1: HD解像度で再試行
    Serial.println("Spresense: Trying HD fallback 1280x960...");
    err = theCamera.setStillPictureImageFormat(1280, 960, CAM_IMAGE_PIX_FMT_JPG, 2);
    if (err != CAM_ERR_SUCCESS) {
      // フォールバック2: さらに小さい解像度
      Serial.println("Spresense: Trying VGA fallback 640x480...");
      err = theCamera.setStillPictureImageFormat(640, 480, CAM_IMAGE_PIX_FMT_JPG, 3);
      if (err != CAM_ERR_SUCCESS) {
        Serial.println("Spresense: ERROR - All fallback resolutions failed!");
        while(1);
      }
      Serial.println("Spresense: Using VGA fallback 640x480");
    } else {
      Serial.println("Spresense: Using HD fallback 1280x960");
    }
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

  delay(20000); // 20秒間隔（Full HD大容量ファイル送信時間考慮） 
}
