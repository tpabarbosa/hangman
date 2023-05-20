import randomWords from "random-words";
import './style.css'


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
  [STATE.INVALID_INPUT, new Audio("./sounds/mixkit-cartoon-alert-728.wav")],
  [STATE.ALREADY_GUESSED, new Audio("./sounds/mixkit-cartoon-alert-728.wav")],
  [STATE.WRONG_GUESS, new Audio("./sounds/mixkit-cartoon-alert-728.wav")],
  [STATE.WON, new Audio("./sounds/mixkit-completion-of-a-level-2063.wav")],
  [STATE.RIGHT_GUESS, new Audio("./sounds/mixkit-instant-win-2021.wav")],
  [STATE.LOST, new Audio("./sounds/mixkit-sad-game-over-trombone-471.wav")]
])

const model = {
  _secretWord: undefined,
  _wrongGuesses: 0,
  _rightGuesses: 0,
  _guessedLetters: undefined,
  _MAX_WRONG_GUESSES: 6,
  newGame: function (secretWord) {
    this._secretWord = secretWord.split('')
    this._wrongGuesses = 0
    this._rightGuesses = 0
    this._guessedLetters = new Set()
  },
  run: function (letter) {
    if (!this._isLetter(letter)) {
      return STATE.INVALID_INPUT
    }
    if (this._guessedLetters.has(letter)) {
      return STATE.ALREADY_GUESSED
    }

    this._guessedLetters.add(letter)
    const foundLetters = this._secretWord.filter((value) => value === letter)

    if (foundLetters.length > 0) {
      this._rightGuesses += foundLetters.length
      if (this._rightGuesses === this._secretWord.length) {
        return STATE.WON
      }
      return STATE.RIGHT_GUESS
    } else {
      this._wrongGuesses++
      if (this._wrongGuesses === this._MAX_WRONG_GUESSES) {
        return STATE.LOST
      }
      return STATE.WRONG_GUESS
    }
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

const view = {
  _music: new Audio("./sounds/Sneaky-Snitch.mp3"),
  _word: document.getElementById('word'),
  _manImage: document.getElementById('manImage'),
  _message: document.getElementById('message'),
  _guessedLetters: document.getElementById('guessedLetters'),
  _form: document.getElementById('inputLetterForm'),
  _userInput: document.getElementById('userInput'),
  _button: document.getElementById('enterBtn'),
  _startNewGame: document.getElementById('startNewGame'),
  _divLetters: undefined,
  _lastInput: undefined,
  _secretWord: undefined,
  newGame: function (secretWord) {
    this._playMusic()
    this._secretWord = secretWord.split('');
    this._word.innerHTML = ''
    for (let i = 0; i < this._secretWord.length; i++) {
      const divLetter = document.createElement('div');
      divLetter.classList.add('letter')
      this._word.append(divLetter)
    }
    this._divLetters = document.querySelectorAll('.letter')
    this._manImage.src = './images/0.jpg'
    this._message.textContent = ''
    this._guessedLetters.textContent = ''
    this._userInput.style.display = 'inline-block'
    this._button.style.display = 'inline-block'
    this._startNewGame.style.display = 'none'
    this._userInput.focus()
  },
  _playMusic: function () {
    if (this._music.paused) {
      this._music.play()
      this._music.loop = true
      this._music.volume = 0.7
    }
  },
  onClickStartGame: function (callback) {
    this._startNewGame.addEventListener('click', (e) => {
      e.preventDefault()
      callback()
    })
  },
  onSubmit: function (callback) {
    this._form.addEventListener('submit', (e) => {
      e.preventDefault();
      this._lastInput = this._userInput.value
      this._userInput.value = ''
      this._message.classList.remove('error', 'right', 'wrong')
      setTimeout(() => {
        callback(this._lastInput)
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
    if (state === STATE.WON || state === STATE.LOST) {
      this._endGame()
    }
    this._updateGuessedLetters(guessedLetters)
    this._renderMessage(state)
    SFX.get(state).play()
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
  _updateHangman: function (wrongGuesses) {
    this._manImage.src = `./images/${wrongGuesses}.jpg`
  },
  _endGame: function () {
    this._userInput.style.display = 'none'
    this._button.style.display = 'none'
    this._startNewGame.style.display = 'block'
    this._startNewGame.focus()
    this._music.pause()
  },
}

const controller = {
  _yesBtn: document.getElementById('yesBtn'),
  _page_1: document.getElementById('page-1'),
  _page_2: document.getElementById('page-2'),
  _startNewGame: function () {
    let secretWord = randomWords()
    while (secretWord.length < 5 || secretWord.length > 12) {
      secretWord = randomWords()
    }
    model.newGame(secretWord)
    view.newGame(secretWord)
  },
  init: function () {
    view.onSubmit(this._processInput)
    view.onClickStartGame(this._startNewGame)
    this._yesBtn.addEventListener('click', (e) => {
      e.preventDefault()
      this._page_1.classList.add('hidden')
      this._page_2.classList.remove('hidden')
      this._startNewGame()
    })
  },
  _processInput: function (letter) {
    const result = model.run(letter)
    view.update(result, model.wrongGuesses, model.guessedLetters)
  }
}

controller.init()
