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

//ref 3d shader from https://www.openprocessing.org/sketch/881537
const vert =  `
	precision highp float;

    // attributes, in
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    attribute vec2 aTexCoord;

    // attributes, out
    varying vec3 var_vertPos;
    varying vec3 var_vertNormal;
    varying vec2 var_vertTexCoord;
		varying vec4 var_centerGlPosition;//原点
    
    // matrices
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    uniform mat3 uNormalMatrix;
		uniform float u_time;


    void main() {
      vec3 pos = aPosition;
			vec4 posOut = uProjectionMatrix * uModelViewMatrix * vec4(pos, 1.0);
      gl_Position = posOut;

      // set out value
      var_vertPos      = pos;
      var_vertNormal   =  aNormal;
      var_vertTexCoord = aTexCoord;
			var_centerGlPosition = uProjectionMatrix * uModelViewMatrix * vec4(0., 0., 0.,1.0);
    }
`;



const frag_functions_default = `
	float rand(vec2 c){
		return fract(sin(dot(c.xy ,vec2(12.9898,78.233))) * 43758.5453);
	}

	mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
	}

	mat2 scale2d(vec2 _scale){
			return mat2(_scale.x,0.0,
									0.0,_scale.y);
	}

	vec2 tile (vec2 _st, float _zoom) {
			_st *= _zoom;
			return fract(_st);
	}

	//	Classic Perlin 3D Noise 
	//	by Stefan Gustavson

	vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
	vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
	vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

	float cnoise(vec3 P){
		vec3 Pi0 = floor(P); // Integer part for indexing
		vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
		Pi0 = mod(Pi0, 289.0);
		Pi1 = mod(Pi1, 289.0);
		vec3 Pf0 = fract(P); // Fractional part for interpolation
		vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
		vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
		vec4 iy = vec4(Pi0.yy, Pi1.yy);
		vec4 iz0 = Pi0.zzzz;
		vec4 iz1 = Pi1.zzzz;

		vec4 ixy = permute(permute(ix) + iy);
		vec4 ixy0 = permute(ixy + iz0);
		vec4 ixy1 = permute(ixy + iz1);

		vec4 gx0 = ixy0 / 7.0;
		vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
		gx0 = fract(gx0);
		vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
		vec4 sz0 = step(gz0, vec4(0.0));
		gx0 -= sz0 * (step(0.0, gx0) - 0.5);
		gy0 -= sz0 * (step(0.0, gy0) - 0.5);

		vec4 gx1 = ixy1 / 7.0;
		vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
		gx1 = fract(gx1);
		vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
		vec4 sz1 = step(gz1, vec4(0.0));
		gx1 -= sz1 * (step(0.0, gx1) - 0.5);
		gy1 -= sz1 * (step(0.0, gy1) - 0.5);

		vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
		vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
		vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
		vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
		vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
		vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
		vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
		vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

		vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
		g000 *= norm0.x;
		g010 *= norm0.y;
		g100 *= norm0.z;
		g110 *= norm0.w;
		vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
		g001 *= norm1.x;
		g011 *= norm1.y;
		g101 *= norm1.z;
		g111 *= norm1.w;

		float n000 = dot(g000, Pf0);
		float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
		float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
		float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
		float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
		float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
		float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
		float n111 = dot(g111, Pf1);

		vec3 fade_xyz = fade(Pf0);
		vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
		vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
		float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
		return 2.2 * n_xyz;
	}

	vec2 random2( vec2 p ) {
			return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
	}

`;


const frag = `
	precision highp float;

	uniform vec2 u_resolution;
	uniform vec2 u_mouse;
	uniform float u_time;
	uniform vec3 u_lightDir;
	uniform vec3 u_col;
	uniform mat3 uNormalMatrix;
	uniform float u_pixelDensity;
	uniform sampler2D tex0;

	//attributes, in
	varying vec4 var_centerGlPosition;
	varying vec3 var_vertNormal;
	varying vec2 var_vertTexCoord;

	${frag_functions_default}


	void main(){
		vec2 st = var_vertTexCoord.xy /u_resolution.xy;
		// st.y = 1.0 - st.y;
		vec3 color = vec3(255.);
		float d = distance(u_mouse,st);

		vec2 distorted_st = st;
		distorted_st.x+=cnoise(vec3(st.x*5000.,st.y*3000.,u_time))/(1.+(sin(sqrt(st.y+u_time/20.)*50.)+1.)*500.)/2.;
		distorted_st.y+=cnoise(vec3(st.x*5000.,st.y*3000.,u_time))/(1.+(sin(sqrt(st.y+u_time/10.)*50.)+1.)*1000.)/2.;
		distorted_st.x += sin(distorted_st.y*(50.+sin(st.x)*20.)+u_time)*distorted_st.y*distorted_st.y/10.;
		color*=texture2D(tex0,distorted_st).rgb;
		color*=1.-d;
		
		color*=cnoise(vec3(st.x*5000.,st.y*3000.,u_time))+0.5;
		gl_FragColor= vec4(color,1.0);
	}
`;

let theShader;
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

function preload() {
	db = loadJSON('db.json');
	font1 = loadFont(FONT_NAME);
	theShader = new p5.Shader(this.renderer,vert,frag);
}

let drawingGraphics
let WebglGraphics

function setup() {
	createCanvas(windowWidth, windowHeight);
	WebglGraphics = createGraphics(windowWidth,windowHeight,WEBGL)
	drawingGraphics = createGraphics(windowWidth,windowHeight)
	textFont(font1);
	fill(255);

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

function drawStroke() {
	WebglGraphics.shader(theShader)
	theShader.setUniform('u_resolution',[windowWidth/1000,windowHeight/1000])
	theShader.setUniform('u_time',millis()/1000)
	//theShader.setUniform('u_mouse',[100,200])
	theShader.setUniform('tex0',drawingGraphics)
	drawingGraphics.clear(0,0,windowWidth,windowHeight)
	drawingGraphics.stroke(255)
	//drawingGraphics.strokeWeight(2)

	//(x1, y1, x2, y2, x3, y3)
	for (var i = 0; i < 20; i++) {
		var j = Math.random();
		drawingGraphics.line(0, j * 1000, windowWidth, j * 1000)
	}
	
	//drawingGraphics.bezier(0, windowHeight * 0.75, windowWidth * 0.35, windowHeight * 0.6, windowWidth * 0.6, windowHeight * 0.7, windowWidth, windowHeight * 0.5);
	//drawingGraphics.bezier(0, windowHeight * 0.85, windowWidth * 0.5, windowHeight * 0.9, windowWidth * 0.6, windowHeight * 0.95, windowWidth, windowHeight);
}

function draw() {
    background(0);
  	
	textSize(TEXT_SIZE);
	

	image(WebglGraphics, 0, 0)
	
  	t++;

  	for (let i = 0; i < 3; i++) {

  		fill(105);
  		//drawRectangle(i);
  		fill(255);

  		drawStream(i);

  		
  		
  	}
  	
	drawStroke();
	drawingGraphics.fill(255)
	//for(var i=300;i<windowHeight;i+=200){
	//	drawingGraphics.ellipse(400,500,i)
	//}
	
	WebglGraphics.rect(-windowWidth/2,-windowHeight/2, windowWidth,windowHeight * 2.2)
	
	
}
