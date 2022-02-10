import React, { useState, useEffect, useRef, useCallback } from 'react'

export function useInterval(callback, delay) {
  const savedCallback = useRef()

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallback.current()
    }
    if (delay !== null) {
      let id = setInterval(tick, delay)
      return () => clearInterval(id)
    }
  }, [delay])
}

const getHeightAndWidthOf = (container) => {
  let { width, height } = container.current.getBoundingClientRect()
  width -= 4
  height -= 4
  return [width, height]
}
const useOnResizing = (container) => {
  const [value, setValue] = useState([0, 0])
  const cb = () => {
    let [width, height] = getHeightAndWidthOf(container)
    if ((value[0] === width && value[1] === height) || width < 300) return
    setValue([width, height])
  }
  useEffect(() => {
    cb()
  }, [])
  useEffect(() => {
    window.addEventListener('resize', cb)
    return () => window.removeEventListener('resize', cb)
  })
  return value
}

export default function SnakeGame() {
  const container = useRef()
  const snakeFocus = useRef()
  const timer = useRef()
  // helper
  const toKey = (i, j) => `${i}_${j}`
  const spliter = (value) => {
    let result = value.split('_')
    return [+result[0], +result[1]]
  }
  const [widthContainer, heightContainer] = useOnResizing(container)
  const [random, setRandom] = useState()
  const [collide, setCollide] = useState(false)
  const [onKeyClick, setOnKeyClick] = useState()
  const [cordinates, setCordinates] = useState(['8_8', '8_9', '8_10', '8_11'])
  const genrateUnique = () => {
    let [width, height] = getHeightAndWidthOf(container)
    const cols = height / 25
    const rows = width / 25
    const colsRandom = Math.floor(cols * Math.random())
    const rowsRandom = Math.floor(rows * Math.random())
    const randomDeminsion = toKey(rowsRandom, colsRandom)
    if (cordinates.includes(randomDeminsion)) {
      return genrateUnique()
    }
    return randomDeminsion
  }
  useEffect(() => {
    setRandom(genrateUnique())
    snakeFocus.current.focus()
  }, [])
  // snake Movment everysec
  useInterval(
    () => {
      onSnakeMove(onKeyClick)
    },
    !onKeyClick || collide ? null : 150
  )
  useEffect(() => {
    if (collide) {
      clearInterval(timer)
    }
  })

  const onKeyDown = (e) => {
    const arrows = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
    if (!arrows.includes(e.key) || collide) return
    setOnKeyClick(e.key)
  }
  const onSnakeMove = (key) => {
    const onMovment = (direction) => {
      let value = [...cordinates]
      let lastValue = value[value.length - 1]
      let firstValue = value.shift()
      let ifHitRandom = firstValue
      let [theX, theY] = spliter(lastValue)
      firstValue = direction(theX, theY)
      // check if hit random
      if (firstValue === random) {
        setRandom(genrateUnique())
        value.unshift(ifHitRandom)
        new Audio('/chew.wav').play()
      }
      // check if  a border are touched or hit itself
      const checkAfter = spliter(firstValue)
      if (touchLosing(checkAfter[0], checkAfter[1], firstValue)) {
        setCollide(true)
        new Audio('/hit.mp3').play()
        return
      }
      value.push(firstValue)
      setCordinates(value)
    }
    const touchLosing = (x, y, firstValue) => {
      // if touch borders
      if (y + 1 > widthContainer / 25 || y < 0) return true
      if (x + 1 > heightContainer / 25 || x < 0) return true
      // if touch himself
      if (cordinates.includes(firstValue)) return true
    }

    const moveRight = (x, y) => toKey(x, y + 1)
    const moveLeft = (x, y) => toKey(x, y - 1)
    const moveDown = (x, y) => toKey(x + 1, y)
    const moveUp = (x, y) => toKey(x - 1, y)
    switch (key) {
      case 'ArrowUp':
        onMovment(moveUp)
        break
      case 'ArrowDown':
        onMovment(moveDown)
        break
      case 'ArrowLeft':
        onMovment(moveLeft)
        break
      case 'ArrowRight':
        onMovment(moveRight)
        break
    }
  }
  const onPlayAgain = useCallback(() => {
    setCordinates(['8_8', '8_9', '8_10', '8_11'])
    setRandom(genrateUnique())
    setOnKeyClick(null)
    setCollide(false)
  }, [collide])
  const drewBorder = () => {
    const cordinatesPicker = (i) => cordinates[cordinates.length - i]
    return Array.from({ length: widthContainer / 25 }, (_, i) =>
      Array.from({ length: heightContainer / 25 }, (_, j) => {
        return (
          <Box
            key={i + j}
            directionBorder={onKeyClick || 'ArrowRight'}
            head={cordinatesPicker(1) === toKey(i, j)}
            tail={cordinates[0] === toKey(i, j)}
            snake={cordinates.includes(toKey(i, j))}
            random={random === toKey(i, j)}
          />
        )
      })
    )
  }
  return (
    <div
      onClick={() => snakeFocus.current.focus()}
      className="flex-center h-screen w-screen bg-gray-800 "
    >
      {collide && (
        <div className="flex-center absolute top-20 h-[100px] w-screen flex-col gap-2 text-lg font-bold  text-white">
          <h1>Nice, your Score: {cordinates.length}</h1>
          <button
            onClick={onPlayAgain}
            className="rounded-lg border-4 border-orange-300 bg-white px-8 py-2 text-orange-900"
          >
            Again
          </button>
        </div>
      )}
      <input
        ref={snakeFocus}
        type="text"
        className="pointer-events-none absolute top-0 left-0 opacity-0"
        onKeyDown={onKeyDown}
      />
      <div
        ref={container}
        className={` xs:w-[500px] xs:h-[500px]  h-[350px] w-[350px]   border-2 leading-[0] ${
          collide ? 'border-orange-800' : 'border-white'
        } box-content`}
      >
        {drewBorder()}
      </div>
    </div>
  )
}
const Box = React.memo(({ snake, random, tail, head, directionBorder }) => {
  const borderSnake = () => {
    if (head) {
      if (directionBorder === 'ArrowUp')
        return 'rounded-tl-lg rounded-tr-lg  bg-orange-300'
      if (directionBorder === 'ArrowDown')
        return 'rounded-br-lg rounded-bl-lg  bg-orange-300'
      if (directionBorder === 'ArrowLeft')
        return 'rounded-tl-lg rounded-bl-lg bg-orange-300'
      if (directionBorder === 'ArrowRight')
        return 'rounded-tr-lg rounded-br-lg bg-orange-300'
    }
    if (tail) {
      return 'bg-orange-800'
    }
    return 'bg-orange-100'
  }
  const snakeBody = () => {
    if (snake) return `${borderSnake()}   `
    if (random) return ' bg-yellow-600 rounded-full'
  }
  return (
    <span className={`${snakeBody()} inline-block  h-[25px] w-[25px] `}></span>
  )
})
