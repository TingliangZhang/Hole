BufferedReader reader;
//reader = createReader("Data.txt");
PGraphics mask;
int WHITE = color(0);
int BLACK = color(0);
//String Data = loadStrings("Data.txt"); 

void setup() {
  size(1000, 1000);
  noStroke();
  drawDemoMask();
}

void draw() {
  background(WHITE);
  fill(255);
  ellipse(mouseX, mouseY, 300, 300);
  maskPixels();
}

void drawDemoMask() {
  mask = createGraphics(width, height);
  mask.beginDraw();
  mask.background(0);
  mask.textSize(60);
  mask.textAlign(CENTER, CENTER);
  mask.text("We have also come to this hallowed spot \n to remind America of the fierce urgency of Now.  \n This is no time to engage in the  \n luxury of cooling off or to take the  \n tranquilizing drug of gradualism.  \n ", 500, 500);
  mask.endDraw();
  mask.loadPixels();
}

void maskPixels() {
  loadPixels();
  for (int i=0; i < mask.pixels.length; ++i) {
    int maskPixel = mask.pixels[i];
    if (maskPixel != WHITE) {
      pixels[i] = BLACK;
    }
  }
  updatePixels();
}
