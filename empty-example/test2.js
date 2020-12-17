// 重力大小
const GRAVITY = 0.6;
// 相邻两句话之间的空格数量
const BLANK_LEN = 3;
// 字体大小
const TEXT_SIZE = 30;
// 字体名称 (将字体文件放置在当前目录下)
const FONT_NAME = '方正细金陵简体.TTF';
// 每个流的最多字数 (超出后最早出现的会被删除，节省内存)
const BUFFER_LEN = 50;
// 每个流的横向偏移量
const STREAM_OFFSET_X = [350, 600, 850];
// 所有流的纵向偏移量
const STREAM_OFFSET_Y = 400;
// 地面的纵向偏移量
const FLOOR_OFFSET_Y = 1000;
// 文字出现位置的横向不确定度
const BIRTH_PLACE_UNCERTAINTY_X = 6;
// 文字出现位置的旋转角不确定度
const BIRTH_PLACE_UNCERTAINTY_ANGLE = 0.01;
// 是否正序出现一句话
const FIRST_WORD_FIRST_OUT = true;

const Engine = Matter.Engine;
const World = Matter.World;
const Bodies = Matter.Bodies;

// 经过的帧数
let t = 0;
// 文本数据库
let db;
// 字体
let font1;
// 世界 (see Matter.js Doc)
let world;

// 文字流 (类型为 Generator，每次可获得一个字)
let streams = [];
// 缓冲区
let buffers = [];

let system;

let system2;

let system3;

function preload() {
	db = loadJSON('db.json');
	font1 = loadFont(FONT_NAME);
}

function setup() {
	createCanvas(windowWidth, windowHeight);
	
	textFont(font1);
	fill(255);

	system = new ParticleSystem(createVector(STREAM_OFFSET_X[0], STREAM_OFFSET_Y));
	system2 = new ParticleSystem(createVector(STREAM_OFFSET_X[1], STREAM_OFFSET_Y));
	system3 = new ParticleSystem(createVector(STREAM_OFFSET_X[2], STREAM_OFFSET_Y));

	if (FIRST_WORD_FIRST_OUT) {
		for (let i = 0; i < Object.keys(db).length; i++) {
			const strArr = Array.from(db[i]);
			//strArr.reverse();

			db[i] = strArr;
		}
	}

	for (let i = 0; i < 5; i++) {
		streams.push(getStream());
		buffers.push([]);
	}

	const engine = Engine.create();
	world = engine.world;
	world.gravity.y = GRAVITY;
	World.add(world, Bodies.rectangle(0, FLOOR_OFFSET_Y, 3000, 500, {
		isStatic: true
	}));


	// run the engine
	Engine.run(engine);
}

function* getStream() {
	const getNewIndex = () => {
		return Math.floor(Math.random() * Object.keys(db).length);
	};

	let curSentenceIndex = getNewIndex();
	let curWordIndex = db[curSentenceIndex].length - 1;
	let curCooldown = 0;

	while (true) {
		if (curWordIndex < 0) {
			curSentenceIndex = getNewIndex();
			curWordIndex = db[curSentenceIndex].length - 1;
			curCooldown = BLANK_LEN;
		}
		if (curCooldown) {
			yield ' ';
			curCooldown --;
		} else {
			yield db[curSentenceIndex][curWordIndex];
			curWordIndex --;
		}

	}
}
function drawRectangle(k) {
	const offsetX = STREAM_OFFSET_X[k];
	const offsetY = STREAM_OFFSET_Y;
	rect(offsetX - 100, 200, 200, 300);

}

function drawParticle(k) {

}

function drawStream(k) {
	const stream = streams[k];
	const buffer = buffers[k];
	const offsetX = STREAM_OFFSET_X[k];
	const offsetY = STREAM_OFFSET_Y;

	if (!buffer.length || buffer[0][1].position.y - offsetY > TEXT_SIZE) {
		const box = Bodies.rectangle(offsetX + (Math.random() - 0.5) * BIRTH_PLACE_UNCERTAINTY_X, offsetY, TEXT_SIZE, TEXT_SIZE);
		box.angle = BIRTH_PLACE_UNCERTAINTY_ANGLE * (Math.random() - 0.5);
		World.add(world, box);
		buffer.unshift([stream.next().value, box]);
	}

	if (buffer.length >= BUFFER_LEN) {
		World.remove(world, buffer[buffer.length - 1][1]);
		buffer.pop();
	}

	for (let i = 0; i < buffer.length; i++) {
		const box = buffer[i][1];
		const position = box.position;
		const angle = box.angle;
		push();
		translate(position.x, position.y);
		rotate(angle);
		// fill(255);
		// rect(-TEXT_SIZE / 2, -TEXT_SIZE / 2, TEXT_SIZE, TEXT_SIZE);
		text(buffer[i][0], -TEXT_SIZE / 2, TEXT_SIZE / 2);
		pop();
	}
}

function draw() {
    background(0);
  	
	textSize(TEXT_SIZE);
	
  	t++;

  	system.addParticle();
	system.run();
	system2.addParticle();
	system2.run();
	system3.addParticle();
	system3.run();
  	for (let i = 0; i < 3; i++) {
  		//fill(105);
  		//drawRectangle(i);
  		fill(255);
  		drawStream(i);

  		
  	}
  	

}

let Particle = function(position) {
	this.acceleration = createVector(0, 0.05);
	this.velocity = createVector(random(-1, 1), random(-1, 0));
	this.position = position.copy();
	this.lifespan = 255;
};

Particle.prototype.run = function() {
	this.update();
	this.display();
};

// Method to update position
Particle.prototype.update = function(){
  this.velocity.add(this.acceleration);
  this.position.add(this.velocity);
  this.lifespan -= 2;
};

// Method to display
Particle.prototype.display = function() {
  stroke(200, this.lifespan);
  strokeWeight(2);
  fill(127, this.lifespan);
  ellipse(this.position.x, this.position.y, 12, 12);
};

// Is the particle still useful?
Particle.prototype.isDead = function(){
  return this.lifespan < 0;
};

let ParticleSystem = function(position) {
  this.origin = position.copy();
  this.particles = [];
};

ParticleSystem.prototype.addParticle = function() {
  this.particles.push(new Particle(this.origin));
};

ParticleSystem.prototype.run = function() {
  for (let i = this.particles.length-1; i >= 0; i--) {
    let p = this.particles[i];
    p.run();
    if (p.isDead()) {
      this.particles.splice(i, 1);
    }
  }
};


