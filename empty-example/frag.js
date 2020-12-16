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
`