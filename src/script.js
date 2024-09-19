var config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
}

var score = 0
var scoreText
var gameOver = false
var leftButton, rightButton, upButton // Botones táctiles

var game = new Phaser.Game(config)

window.addEventListener('resize', resizeGame)

function resizeGame() {
  var width = window.innerWidth
  var height = window.innerHeight

  game.scale.resize(width, height)
}

function preload() {
  this.load.image('sky', 'assets/sky.png')
  this.load.image('ground', 'assets/platform.png')
  this.load.image('star', 'assets/star.png')
  this.load.image('bomb', 'assets/bomb.png')

  // Cargar imágenes de las flechas con rutas correctas
  this.load.image('leftArrow', 'assets/controls/leftArrow.png') // Imagen de flecha izquierda
  this.load.image('rightArrow', 'assets/controls/rightArrow.png') // Imagen de flecha derecha
  this.load.image('upArrow', 'assets/controls/upArrow.png') // Imagen de flecha de salto

  this.load.spritesheet('dude', 'assets/dude.png', {
    frameWidth: 32,
    frameHeight: 48,
  })
}

function create() {
  this.add
    .image(window.innerWidth / 2, window.innerHeight / 2, 'sky')
    .setDisplaySize(window.innerWidth, window.innerHeight)

  platforms = this.physics.add.staticGroup()
  platforms
    .create(window.innerWidth / 2, window.innerHeight - 32, 'ground')
    .setScale(4)
    .refreshBody()
  platforms.create(window.innerWidth - 200, window.innerHeight / 1.5, 'ground')
  platforms.create(window.innerWidth - 1170, window.innerHeight / 1.5, 'ground')
  platforms.create(680, window.innerHeight / 2.1, 'ground')
  platforms.create(window.innerWidth - 50, window.innerHeight / 2.75, 'ground')
  platforms.create(
    window.innerWidth - 1320,
    window.innerHeight / 2.75,
    'ground'
  )

  player = this.physics.add.sprite(100, 450, 'dude').setScale(1.2)
  player.setCollideWorldBounds(true)
  player.setBounce(0.2)

  this.anims.create({
    key: 'left',
    frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1,
  })

  this.anims.create({
    key: 'turn',
    frames: [{ key: 'dude', frame: 4 }],
    frameRate: 20,
  })

  this.anims.create({
    key: 'right',
    frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
    frameRate: 10,
    repeat: -1,
  })

  this.physics.add.collider(player, platforms)

  cursors = this.input.keyboard.createCursorKeys()

  stars = this.physics.add.group({
    key: 'star',
    repeat: 19,
    setXY: { x: 12, y: 0, stepX: 70 },
  })

  stars.children.iterate(function (child) {
    child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8))
  })

  this.physics.add.collider(stars, platforms)
  this.physics.add.overlap(player, stars, collectStar)

  scoreText = this.add.text(16, 16, 'Score: 0', {
    fontSize: '32px',
    fill: '#000',
  })

  bombs = this.physics.add.group()
  this.physics.add.collider(bombs, platforms)
  this.physics.add.collider(player, bombs, hitBomb, null, this)

  // Crear flechas de control para dispositivos táctiles
  if (this.sys.game.device.input.touch) {
    // Flecha izquierda
    leftButton = this.add
      .image(100, window.innerHeight - 100, 'leftArrow')
      .setInteractive()
      .setScale(1) // Ajusta la escala si es necesario
    leftButton.on('pointerdown', () => player.setVelocityX(-160))
    leftButton.on('pointerup', () => player.setVelocityX(0))

    // Flecha derecha
    rightButton = this.add
      .image(200, window.innerHeight - 100, 'rightArrow')
      .setInteractive()
      .setScale(1)
    rightButton.on('pointerdown', () => player.setVelocityX(160))
    rightButton.on('pointerup', () => player.setVelocityX(0))

    // Flecha de salto
    upButton = this.add
      .image(window.innerWidth - 100, window.innerHeight - 100, 'upArrow')
      .setInteractive()
      .setScale(1)
    upButton.on('pointerdown', () => {
      if (player.body.touching.down) {
        player.setVelocityY(-330)
      }
    })
  }
}

function update() {
  if (gameOver) {
    return
  }

  if (cursors.left.isDown) {
    player.setVelocityX(-160)
    player.anims.play('left', true)
  } else if (cursors.right.isDown) {
    player.setVelocityX(160)
    player.anims.play('right', true)
  } else {
    player.setVelocityX(0)
    player.anims.play('turn')
  }

  if (cursors.up.isDown && player.body.touching.down) {
    player.setVelocityY(-330)
  }
}

function collectStar(player, star) {
  star.disableBody(true, true)

  score += 10
  scoreText.setText('Score: ' + score)

  if (stars.countActive(true) === 0) {
    stars.children.iterate(function (child) {
      child.enableBody(true, child.x, 0, true, true)
    })

    var x =
      player.x < 400
        ? Phaser.Math.Between(400, 800)
        : Phaser.Math.Between(0, 400)

    var bomb = bombs.create(x, 16, 'bomb')
    bomb.setBounce(1)
    bomb.setCollideWorldBounds(true)
    bomb.setVelocity(Phaser.Math.Between(-200, 200), 20)
  }
}

function hitBomb(player, bombs) {
  this.physics.pause() // Pausa la física del juego

  player.setTint(0xff0000) // Cambia el color del jugador a rojo

  player.anims.play('turn') // Muestra la animación de "quieto"

  gameOver = true // Marca el estado del juego como finalizado

  // Reinicia el juego automáticamente después de 2 segundos
  this.time.delayedCall(
    2000,
    () => {
      this.scene.restart() // Reinicia la escena
      gameOver = false // Restablece el estado de "gameOver"
      score = 0 // Reinicia el puntaje
    },
    [],
    this
  )
}
