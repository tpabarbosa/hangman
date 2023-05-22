import randomWords from "random-words";
import './style.css'
import img0 from './images/0.jpg'
import img1 from './images/1.jpg'
import img2 from './images/2.jpg'
import img3 from './images/3.jpg'
import img4 from './images/4.jpg'
import img5 from './images/5.jpg'
import img6 from './images/6.jpg'
import sfx_alert from './sounds/mixkit-cartoon-alert-728.wav'
import sfx_won from './sounds/mixkit-completion-of-a-level-2063.wav'
import sfx_right from './sounds/mixkit-instant-win-2021.wav'
import sfx_lost from './sounds/mixkit-sad-game-over-trombone-471.wav'
import sfx_click from './sounds/button_pressed.mp3'
import music from './sounds/Sneaky-Snitch.mp3'


const STATE = Object.freeze({
  INVALID_INPUT: 'invalid-input',
  ALREADY_GUESSED: 'already-guessed',
  WRONG_GUESS: 'wrong-guess',
  WON: 'won',
  RIGHT_GUESS: 'right-guess',
  LOST: 'lost'
})

const MESSAGE = new Map([
  [STATE.INVALID_INPUT, { msg: `‼ '{:letter}' is not a valid letter`, type: 'error' }],
  [STATE.ALREADY_GUESSED, { msg: `‼ Letter '{:letter}' has already been guessed`, type: 'error' }],
  [STATE.WRONG_GUESS, { msg: '❌ Wrong Guess', type: 'wrong' }],
  [STATE.WON, { msg: '🏆 You saved the man! 🏆', type: 'right' }],
  [STATE.RIGHT_GUESS, { msg: '✔ Right Guess', type: 'right' }],
  [STATE.LOST, { msg: '😭 The man is dead! 😭', type: 'wrong' }]
]);

const SFX = new Map([
  [STATE.INVALID_INPUT, new Audio(sfx_alert)],
  [STATE.ALREADY_GUESSED, new Audio(sfx_alert)],
  [STATE.WRONG_GUESS, new Audio(sfx_alert)],
  [STATE.WON, new Audio(sfx_won)],
  [STATE.RIGHT_GUESS, new Audio(sfx_right)],
  [STATE.LOST, new Audio(sfx_lost)],
  ['click', new Audio(sfx_click)]
])

const IMAGES = [img0, img1, img2, img3, img4, img5, img6]

const gameModel = {
  _secretWord: undefined,
  _wrongGuesses: 0,
  _rightGuesses: 0,
  _guessedLetters: undefined,
  _MAX_WRONG_GUESSES: 6,
  _currentState: '',
  _storage: undefined,
  init: function (storage) {
    this._storage = storage
  },
  newGame: function (secretWord) {
    this._secretWord = secretWord.split('')
    this._wrongGuesses = 0
    this._rightGuesses = 0
    this._guessedLetters = new Set()
    this._currentState = ''
    this._toStorage()
  },
  run: function (letter) {
    if (!this._isLetter(letter)) {
      this._toStorage()
      this._currentState = STATE.INVALID_INPUT
      return this._currentState
    }
    if (this._guessedLetters.has(letter)) {
      this._toStorage()
      this._currentState = STATE.ALREADY_GUESSED
      return this._currentState
    }

    this._guessedLetters.add(letter)
    const foundLetters = this._secretWord.filter((value) => value === letter)

    if (foundLetters.length > 0) {
      this._rightGuesses += foundLetters.length
      this._currentState = STATE.RIGHT_GUESS
      if (this._rightGuesses === this._secretWord.length) {
        this._currentState = STATE.WON
      }
    } else {
      this._wrongGuesses++

      this._currentState = STATE.WRONG_GUESS
      if (this._wrongGuesses === this._MAX_WRONG_GUESSES) {
        this._currentState = STATE.LOST
      }
    }
    this._toStorage()
    return this._currentState
  },
  _toStorage: function () {
    this._storage.saveGame({
      secretWord: this._secretWord,
      wrongGuesses: this._wrongGuesses,
      rightGuesses: this._rightGuesses,
      guessedLetters: [...this._guessedLetters],
      state: this._currentState
    })
  },
  loadGame: function (state) {
    this._secretWord = state.secretWord
    this._wrongGuesses = state.wrongGuesses
    this._rightGuesses = state.rightGuesses
    this._guessedLetters = new Set(state.guessedLetters)
    this._currentState = state.state
  },
  _isLetter: function (character) {
    const regex = new RegExp(/^[A-Za-z]+$/)
    return regex.test(character)
  },
  get guessedLetters() {
    return [...this._guessedLetters].join(', ')
  },
  get wrongGuesses() {
    return this._wrongGuesses
  }
}

const statsModel = {
  _victories: 0,
  _defeats: 0,
  _victories_in_row: 0,
  _defeats_in_row: 0,
  _max_victories_in_row: 0,
  _max_defeats_in_row: 0,
  _storage: undefined,
  init: function (storage) {
    this._storage = storage
    const stats = this._storage.loadStats()
    if (stats) {
      this._fromStorage(stats)
    }
  },
  update: function (result) {
    if (result === STATE.WON) {
      this._victories++
      this._victories_in_row++
      if (this._max_victories_in_row < this._victories_in_row) {
        this._max_victories_in_row = this._victories_in_row
      }
      this._defeats_in_row = 0
    } else if (result === STATE.LOST) {
      this._defeats++
      this._defeats_in_row++
      if (this._max_defeats_in_row < this._defeats_in_row) {
        this._max_defeats_in_row = this._defeats_in_row
      }
      this._victories_in_row = 0
    } else {
      return
    }
    this._toStorage()
  },
  _toStorage: function () {
    this._storage.saveStats({
      victories: this._victories,
      defeats: this._defeats,
      victories_in_row: this._victories_in_row,
      defeats_in_row: this._defeats_in_row,
      max_victories_in_row: this._max_victories_in_row,
      max_defeats_in_row: this._max_defeats_in_row
    })
  },
  _fromStorage: function (stats) {
    this._victories = stats.victories
    this._defeats = stats.defeats
    this._victories_in_row = stats.victories_in_row
    this._defeats_in_row = stats.defeats_in_row
    this._max_victories_in_row = stats.max_victories_in_row
    this._max_defeats_in_row = stats.max_defeats_in_row
  }
}

const gameView = {
  _soundPlayer: undefined,
  _word: document.getElementById('word'),
  _manImage: document.getElementById('manImage'),
  _message: document.getElementById('message'),
  _guessedLetters: document.getElementById('guessedLetters'),
  _form: document.getElementById('inputLetterForm'),
  _userInput: document.getElementById('userInput'),
  _button: document.getElementById('enterBtn'),
  _startNewGame: document.getElementById('startNewGame'),
  _backToIntro: document.getElementById('backToIntro'),
  _divLetters: undefined,
  _lastInput: undefined,
  _secretWord: undefined,
  init: function (pages, soundPlayer, onSubmit, onClickStartGame) {
    this._soundPlayer = soundPlayer
    this._pages = pages
    this._onSubmit(onSubmit)
    this._onClickStartGame(onClickStartGame)
    this._onClickBack(pages)
  },
  newGame: function (secretWord) {
    this._secretWord = secretWord.split('');
    this._prepareView()
  },
  _prepareView: function (wrongGuesses = 0, guessedLetters = []) {
    // this._playMusic()
    this._soundPlayer.playMusic()
    this._createDivLetters(guessedLetters)
    this._updateHangman(wrongGuesses)
    this._message.textContent = ''
    this._guessedLetters.textContent = ''
    this._userInput.style.display = 'inline-block'
    this._button.style.display = 'inline-block'
    this._startNewGame.style.display = 'none'
    this._userInput.focus()
  },
  _createDivLetters: function (guessedLetters = []) {
    this._word.innerHTML = ''
    for (let i = 0; i < this._secretWord.length; i++) {
      const divLetter = document.createElement('div');
      divLetter.classList.add('letter')
      if (guessedLetters.includes(this._secretWord[i])) {
        divLetter.textContent = this._secretWord[i]
      }
      this._word.append(divLetter)
    }

    this._divLetters = document.querySelectorAll('.letter')
  },
  loadGame: function (state) {
    this._secretWord = state.secretWord
    this._prepareView(state.wrongGuesses, state.guessedLetters)
    this._updateGuessedLetters(state.guessedLetters)
  },
  _onClickBack: function (pages) {
    this._backToIntro.addEventListener('click', (e) => {
      e.preventDefault()
      pages.intro.classList.remove('hidden')
      pages.game.classList.add('hidden')
      this._soundPlayer.playSfx('click')
    })
  },
  _onClickStartGame: function (onClickStartGame) {
    this._startNewGame.addEventListener('click', (e) => {
      e.preventDefault()
      onClickStartGame()
      this._soundPlayer.playSfx('click')
    })
  },
  _onSubmit: function (onSubmit) {
    this._form.addEventListener('submit', (e) => {
      e.preventDefault();
      this._lastInput = (this._userInput.value).toLowerCase()
      this._userInput.value = ''
      this._message.classList.remove('error', 'right', 'wrong')
      setTimeout(() => {
        onSubmit(this._lastInput)
        this._userInput.focus()
      }, 100)
    })
  },
  update: function (state, wrongGuesses, guessedLetters) {
    if (state === STATE.WRONG_GUESS || state === STATE.LOST) {
      this._updateHangman(wrongGuesses)
    }
    if (state === STATE.RIGHT_GUESS || state === STATE.WON) {
      this._revealRightLetters(this._lastInput)
    }
    if (state === STATE.LOST) {
      this._revealSecretWord()
    }
    if (state === STATE.WON || state === STATE.LOST) {
      this._endGame()
    }
    this._updateGuessedLetters(guessedLetters)
    this._renderMessage(state)
    this._soundPlayer.playSfx(state)
  },
  _renderMessage: function (state) {
    this._message.textContent = MESSAGE.get(state).msg.replace('{:letter}', this._lastInput)
    this._message.classList.add(MESSAGE.get(state).type)
  },
  _updateGuessedLetters: function (guessedLetters) {
    this._guessedLetters.textContent = guessedLetters
  },
  _revealRightLetters: function (letter) {
    this._secretWord.forEach((value, index) => {
      if (value === letter) {
        this._divLetters[index].textContent = letter
      }
    })
  },
  _revealSecretWord: function () {
    this._secretWord.forEach((value, index) => {
      if (!this._divLetters[index].textContent) {
        this._divLetters[index].textContent = value
        this._divLetters[index].classList.add('wrong')
      }
    })
  },
  _updateHangman: function (wrongGuesses) {
    this._manImage.src = IMAGES[wrongGuesses]
  },
  _endGame: function () {
    this._userInput.style.display = 'none'
    this._button.style.display = 'none'
    this._startNewGame.style.display = 'block'
    this._startNewGame.focus()
  },
}

const storage = {
  game: {
    saveGame: function (state) {
      const stateToSave = { ...state, secretWord: window.btoa(state.secretWord.join('')) }
      localStorage.setItem('hangman-game', JSON.stringify(stateToSave))
    },
    loadGame: function () {
      const loaded = JSON.parse(localStorage.getItem('hangman-game'))
      if (!loaded) return
      return { ...loaded, secretWord: window.atob(loaded.secretWord).split('') }
    },
    removeGame: function () {
      localStorage.removeItem('hangman-game')
    },
  },
  stats: {
    saveStats: function (stats) {
      localStorage.setItem('hangman-stats', JSON.stringify(stats))
    },
    loadStats: function () {
      const loaded = JSON.parse(localStorage.getItem('hangman-stats'))
      if (!loaded) return
      return loaded
    },
    removeStats: function () {
      localStorage.removeItem('hangman-stats')
    },
  },
  sound: {
    saveSoundPreferences: function (preferences) {
      localStorage.setItem('hangman-sound', JSON.stringify(preferences))
    },
    loadSoundPreferences: function () {
      const loaded = JSON.parse(localStorage.getItem('hangman-sound'))
      if (!loaded) return
      return loaded
    },
  }
}

const introView = {
  _yesBtn: document.getElementById('yesBtn'),
  _statsBtn: document.getElementById('statsBtn'),
  _pages: undefined,
  init: function (pages, onClickYes, onClickStats) {
    this._pages = pages
    this._yesBtn.addEventListener('click', (e) => {
      e.preventDefault()
      this._pages.intro.classList.add('hidden')
      this._pages.game.classList.remove('hidden')
      onClickYes()
    })
    this._statsBtn.addEventListener('click', (e) => {
      e.preventDefault()
      this._pages.intro.classList.add('hidden')
      this._pages.stats.classList.remove('hidden')
      onClickStats()
    })
  },
}

const statsView = {
  _resetBtn: document.getElementById('resetBtn'),
  _backBtn: document.getElementById('backBtn'),
  _victories: document.getElementById('victories'),
  _defeats: document.getElementById('defeats'),
  _victories_in_row: document.getElementById('victories-in-row'),
  _defeats_in_row: document.getElementById('defeats-in-row'),
  _max_victories_in_row: document.getElementById('max-victories'),
  _max_defeats_in_row: document.getElementById('max-defeats'),
  _storage: undefined,
  _soundPlayer: undefined,
  init: function (pages, storage, soundPlayer) {
    this._storage = storage
    this._soundPlayer = soundPlayer
    this._resetBtn.addEventListener('click', (e) => {
      e.preventDefault()
      this._storage.removeStats()
      this._soundPlayer.playSfx('click')
      this._victories.textContent = 0
      this._defeats.textContent = 0
      this._victories_in_row.textContent = 0
      this._defeats_in_row.textContent = 0
      this._max_victories_in_row.textContent = 0
      this._max_defeats_in_row.textContent = 0
    })
    this._backBtn.addEventListener('click', (e) => {
      e.preventDefault()
      pages.stats.classList.add('hidden')
      pages.intro.classList.remove('hidden')
      this._soundPlayer.playSfx('click')
    })
  },
  load: function () {
    const stats = this._storage.loadStats()
    if (stats) {
      this._victories.textContent = stats.victories
      this._defeats.textContent = stats.defeats
      this._victories_in_row.textContent = stats.victories_in_row
      this._defeats_in_row.textContent = stats.defeats_in_row
      this._max_victories_in_row.textContent = stats.max_victories_in_row
      this._max_defeats_in_row.textContent = stats.max_defeats_in_row
    }
  },
}

const soundPlayer = {
  _showSoundPlayer: false,
  _music: new Audio(music),
  _isPlaying: false,
  _should_play_music: true,
  _should_play_sfx: true,
  _storage: undefined,
  _musicBtn: document.getElementById('musicBtn'),
  _sfxBtn: document.getElementById('sfxBtn'),
  _soundPlayer: document.getElementById('sound-buttons'),
  init: function (storage) {
    this._storage = storage
    const preferences = this._storage.loadSoundPreferences()
    if (preferences) {
      this._should_play_music = preferences.music
      this._should_play_sfx = preferences.sfx
    }
    this._onClickMusicBtn()
    this._onClickSfxBtn()
  },
  playMusic: function () {
    this._isPlaying = true
    if (this._should_play_music && this._music.paused) {
      this._music.play()
      this._music.loop = true
      this._music.volume = 0.7
    }
  },
  stopMusic: function () {
    this._isPlaying = false
    this._music.pause()
  },
  playSfx: function (sfx) {
    if (this._should_play_sfx) {
      SFX.get(sfx).play()
    }
  },
  _onClickMusicBtn: function () {
    this._musicBtn.addEventListener('change', (e) => {
      this._should_play_music = e.target.checked
      this._toStorage()
      if (this._isPlaying && this._should_play_music) {
        this.playMusic()
      }
      if (!this._should_play_music) {
        this._music.pause()
      }
      this.playSfx('click')
    })
  },
  _onClickSfxBtn: function () {
    this._sfxBtn.addEventListener('change', (e) => {
      this._should_play_sfx = e.target.checked
      this._toStorage()
      this.playSfx('click')
    })
  },
  _toStorage: function () {
    this._storage.saveSoundPreferences({
      music: this._should_play_music,
      sfx: this._should_play_sfx,
    })
  },
  showSoundPlayer: function () {
    this._showSoundPlayer = true
    this._musicBtn.checked = this._should_play_music
    this._sfxBtn.checked = this._should_play_sfx
    this._soundPlayer.classList.remove('hidden')
  }
}

const controller = {
  _pages: {
    intro: document.getElementById('page-intro'),
    game: document.getElementById('page-game'),
    stats: document.getElementById('page-stats'),
  },
  _loadStats: function () {
    soundPlayer.showSoundPlayer()
    soundPlayer.playMusic()
    soundPlayer.playSfx('click')
    statsView.load()
  },
  _startNewGame: function () {
    let secretWord = randomWords()
    while (secretWord.length < 5 || secretWord.length > 12) {
      secretWord = randomWords()
    }
    gameModel.newGame(secretWord)
    gameView.newGame(secretWord)
  },
  _loadOrStartGame: function () {
    soundPlayer.showSoundPlayer()
    soundPlayer.playSfx('click')
    const savedGame = storage.game.loadGame()
    if (savedGame && savedGame.state !== STATE.WON && savedGame.state !== STATE.LOST) {
      gameModel.loadGame(savedGame)
      gameView.loadGame(savedGame)
    } else {
      this._startNewGame()
    }
  },
  init: function () {
    soundPlayer.init(storage.sound)
    introView.init(this._pages, this._loadOrStartGame.bind(this), this._loadStats)

    statsView.init(this._pages, storage.stats, soundPlayer)
    statsModel.init(storage.stats)

    gameView.init(this._pages, soundPlayer, this._processInput, this._startNewGame)
    gameModel.init(storage.game)
  },
  _processInput: function (letter) {
    const result = gameModel.run(letter)
    statsModel.update(result)
    gameView.update(result, gameModel.wrongGuesses, gameModel.guessedLetters)
  }
}

controller.init()
