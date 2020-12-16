let blocks = [];
let graphics;
let letters = "难怪你清男生都如此饥渴 气抖冷？中国男性何时才能站起来？";
let counter = 0;
let char;

function setup() {
	createCanvas(720, 405);
	colorMode(HSB, 0, 100, 100, 100);
	graphics = createGraphics(width, height);
	graphics.noStroke();
	for (let i = 0; i < width * height * 3 / 100; i++) {
		let x = random(width);
		let y = random(height);
		let w = random(3);
		let h = random(3);
		let a = random(TWO_PI);
		graphics.fill(random(255), 30);
		graphics.push();
		graphics.translate(x, y);
		graphics.rotate(a);
		graphics.ellipse(0, 0, w, h);
		graphics.pop();
	}
	matter.init();
	platform = matter.makeBarrier(width / 2, height, width, 40);

}

function makeNekodearu(x, y, d) {
	tSize = random(d / 13, d / 10);
	textSize(tSize);
	textFont("serif");
	char = letters.substr(counter++%letters.length, 1).toUpperCase();
	let b = matter.makeSign(char, x, y);
	b.textSize = tSize;
	blocks.push(b);
}

function mousePressed() {
	makeNekodearu(mouseX, mouseY, random(width / 10));
}

function draw() {
	clear();
	fill(255);
  	rect(70, 80, 150, 200);
  	fill(255);
  	rect(270, 80, 150, 200);
  	fill(255);
  	rect(470, 80, 150, 200);

	fill(0);
	noStroke();
	platform.show();

	if (frameCount % 10 == 0) {
		let d = random(width / 10 , width / 4);
		let x = random(150,160);
		let rand = random(0, 3);
		if (rand <= 1) {
			x = random(150, 160);
		} else if (rand <= 2) {
			x = random(350,360);
		} else {
			x = random(550, 560);
		}
		let y = random(220,200);
		makeNekodearu(x, y, d);
	}



	for (let i = blocks.length - 1; i >= 0; i--) {
		let b = blocks[i];
		// print(b);
		let p = b.body.position;
		push();
		translate(p.x, p.y, 0);
		rotate(b.body.angle);
		fill(0, 0, 0);
		textAlign(CENTER, CENTER);
		textStyle(BOLD);
		textSize(b.textSize);
		text(b.text, 0, 0);
		pop();
		if (b.isOffCanvas()) {
			matter.forget(b);
			blocks.splice(i, 1);
		}
	}
	push();
	let g = get();
	clear();
	background(0, 0, 90);
	image(graphics, 0, 0);
	drawingContext.shadowColor = color(0, 0, 0, 33);
	drawingContext.shadowBlur = width / 40;
	drawingContext.shadowOffsetX = width / 100;
	drawingContext.shadowOffsetY = width / 50;
	image(g, 0, 0);
	pop();

	
}