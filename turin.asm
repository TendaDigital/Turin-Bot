; TurinBot Compiled Assembly

section .data
	;Current Register
	register db 0
	;Registers
	registers db 0, 0, 0, 0, 0, 0, 0
	; String readQuestion
	readQuestion: db 'Type in read answer (y/n):',10
	readQuestionLen: equ $-readQuestion
	; String hello
	hello: db 'Running Code',10
	helloLen: equ $-hello
	; String front
	front: db 'robot: front',10
	frontLen: equ $-front
	; String left
	left: db 'robot: left',10
	leftLen: equ $-left
	; String right
	right: db 'robot: right',10
	rightLen: equ $-right
	; String beep
	beep: db 'robot: beep',10
	beepLen: equ $-beep

section .bss
	buf resb 1       ; 1000-byte buffer (in data section)

section .text
	global _start

robot_front:
	;function begin
	;Print variable front
	mov eax,4
	mov ebx,1
	mov ecx,front
	mov edx,frontLen
	int 80h
	ret
	;end

robot_left:
	;function begin
	;Print variable left
	mov eax,4
	mov ebx,1
	mov ecx,left
	mov edx,leftLen
	int 80h
	ret
	;end

robot_right:
	;function begin
	;Print variable right
	mov eax,4
	mov ebx,1
	mov ecx,right
	mov edx,rightLen
	int 80h
	ret
	;end

robot_beep:
	;function begin
	;Print variable beep
	mov eax,4
	mov ebx,1
	mov ecx,beep
	mov edx,beepLen
	int 80h
	ret
	;end

read:
	;function begin
	;Print variable readQuestion
	mov eax,4
	mov ebx,1
	mov ecx,readQuestion
	mov edx,readQuestionLen
	int 80h
	mov  edx,1
	mov  ecx,buf     ;Save user input to buffer.
	mov  ebx,0        ;From stdin
	mov  eax,3        ;sys_read. Read what user inputs
	int  80h
	mov eax, registers
	add eax, [register]
	mov [eax], byte 1
	mov cl, 'y'
	cmp [buf],cl
	je read_FINALLY
	mov eax, registers
	add eax, [register]
	mov [eax], byte 0
	read_FINALLY:
	ret
	;end

_start:
	;Print variable hello
	mov eax,4
	mov ebx,1
	mov ecx,hello
	mov edx,helloLen
	int 80h
	; nop
	;goToBookmark:PURPLE
	JMP SHORT PURPLE
;saveBookmark:RED
RED:
	;front
	call robot_front
	;goToBookmark:PURPLE
	JMP SHORT PURPLE
;saveBookmark:BLUE
BLUE:
	;right
	call robot_right
	;goToBookmark:PURPLE
	JMP SHORT PURPLE
;saveBookmark:PURPLE
PURPLE:
	;readFromSensor
	call read
	;jumpTrue
	mov eax, registers
	add eax, [register]
	cmp [eax], byte 0
	jne jumpTrue_25
	;goToBookmark:BLUE
	JMP SHORT BLUE
	;jumpTrue callback
	jumpTrue_25:
	;goToBookmark:RED
	JMP SHORT RED
	; nop
	
	mov  eax, 1      ;sys exit
	int 0x80
