import React, { useRef, useState } from 'react'
import Papa from 'papaparse'
import md5 from './md5'
import { WritableStream } from 'web-streams-polyfill/ponyfill'
import * as streamSaver from 'streamsaver'

streamSaver.WritableStream = WritableStream

const App = () => {
  const [headers, setHeaders] = useState([])
  const [parser, setParser] = useState({})
  const [rows, setRows] = useState(0)
  const fieldIndex = useRef()
  const inputRef = useRef()
  const rowCounter = useRef(0)

  let fileStream, writer
  const encode = TextEncoder.prototype.encode.bind(new TextEncoder())

  window.isSecureContext &&
    window.addEventListener('beforeunload', (evt) => {
      writer.abort()
    })

  const str = `contact,field2
123,test
343443,test2
34t34t23t4,test3
wefawef,test4`

  const readRow = (row, parser) => {
    if (rowCounter.current) {
      if (typeof fieldIndex.current !== 'undefined') {
        row.data[fieldIndex.current] = md5(row.data[fieldIndex.current])
        // console.log(row.data)
      }
    } else {
      setHeaders(row.data)
      parser.pause()
      setParser(parser)
    }
    rowCounter.current++
    writer.write(encode(row.data.join(',') + '\n'))
  }

  const config = {
    header: false,
    worker: false,
    step: (row, parser) => {
      readRow(row, parser)
    },
    complete: () => {
      console.log('rows processed:', rowCounter.current)
      setRows(rowCounter.current)
      setHeaders([])
      inputRef.current.value = ''
      rowCounter.current = 0
      writer.close()
    },
  }

  const handleChange = (e) => {
    Papa.parse(inputRef.current.files[0], config)
    fileStream = streamSaver.createWriteStream(`${e.target.value}_md5.csv`)
    writer = fileStream.getWriter()
    console.log('File selected:\n', e.target.value)
  }

  const chooseField = (index) => {
    fieldIndex.current = index
    parser.resume()
  }

  const handleClick = () => {
    fileStream = streamSaver.createWriteStream('md5.csv')
    writer = fileStream.getWriter()
    Papa.parse(str, config)
  }

  return (
    <div style={{ padding: '1rem 2rem' }}>
      <div>
        <h2>Тестирование</h2>
        <button onClick={handleClick}>test string</button>
      </div>
      <br />
      <h2>Использование</h2>
      <div>Выбери файл для преобразования</div>
      <br />
      <input
        type="file"
        onChange={handleChange}
        ref={inputRef}
        id="input"
        multiple
      ></input>
      <br />
      {headers.length > 0 && (
        <div>
          <div style={{ padding: '1rem 0' }}>
            Выбери поле для преобразования:
          </div>
          {headers.map((header, index) => (
            <button
              style={{ display: 'block' }}
              key={header}
              onClick={() => {
                chooseField(index)
              }}
            >
              {header}
            </button>
          ))}
        </div>
      )}
      {rows > 0 && (
        <div style={{ padding: '1rem 0' }}>Обработано {rows} строк</div>
      )}
    </div>
  )
}

export default App
