import React, {useState} from 'react'
import { XAxis, YAxis, Tooltip, LineChart, Line, Legend, Label, LabelList } from 'recharts'
import './App.css';
import dotenv from 'dotenv'

var axios = require("axios").default;

const formattedDate = (unix) => {
  // Create a new JavaScript Date object based on the timestamp
  // multiplied by 1000 so that the argument is in milliseconds, not seconds.
  var date = new Date(unix*1000);

  return date.toLocaleDateString();
}


const handleKeyPress = (e) => {
  if (e.key === 'Enter') {
    document.getElementById('enter').click()
  }
}

const getPortfolioReturn = (portfolio) => {
  let portfolio_return_array = []
  for (var i = 0; i < 250; i++) {    
    let day_return = 0
    for (const stock of portfolio) {
      day_return += (1 / portfolio.length)*(stock['data'][i]['cumulative_return'])
    }
    portfolio_return_array.push({'cumulative_return': day_return, 'date':portfolio[0]['data'][i]['date']})
  }  
  let portfolio_dict = {'ticker': 'Equal Weight Portfolio', 'data': portfolio_return_array}
  return portfolio_dict
}

function Tickers(props) {
  let listed_tickers = props.tickers.map((ticker, tickerIdx) => {
    return <p className="ticker" key={tickerIdx}> {ticker} </p>
  })
  return listed_tickers
}

function Chart(props) {
  const colors = ["red", "green", "blue", "black"];
  return (
    <div className="chart">
    <LineChart width={1000} height={500}>
      <XAxis dataKey="date" type="category" allowDuplicatedCategory={false} >
        <Label value="Date" position="insideBottom" offset={-5}/>
      </XAxis>
      <YAxis label={{ value: 'Cumulative Return', angle: -90, position: 'insideLeft', textAnchor: 'middle' }}/>
      <Tooltip />
      <Legend verticalAlign="top" height={36}/>
      {props.chart_data.map((s,sIdx) => (
        <Line dataKey='cumulative_return' dot={false} data={s.data} name={s.ticker} stroke={colors[sIdx]}>
          <LabelList dataKey={s.ticker} position="right" />
        </Line>
      ))}
    </LineChart>
    </div>
  )
}
 
function App() {
  
  const [currentInputTicker, setCurrentInputTicker] = useState('')
  const [allTickers, setAllTickers] = useState([]);
  const [companyData, setCompanyData] = useState([]);
  
  async function getData(tickers) {
    if (tickers.length > 4) {
      alert('Too many inputs. Choose up to 4 stocks')
      return
    }
    let series = []
    
    for (const ticker of tickers) {
      let data = []
      let stock_dict = {}
      stock_dict['ticker'] = ticker
      var options = {
        method: 'GET',
        url: 'https://apidojo-yahoo-finance-v1.p.rapidapi.com/stock/v3/get-historical-data',
        params: {symbol: ticker, region: 'US'},
        headers: {
          'x-rapidapi-host': 'apidojo-yahoo-finance-v1.p.rapidapi.com',
          'x-rapidapi-key': process.env.REACT_APP_API_KEY
        }
      };
      // console.log(process.env.REACT_APP_API_KEY)
      const response  = await axios.request(options) 

      console.log("response.data: ", response.data)
      response.data['prices'].slice().reverse().forEach(day => {
        data.push({'cumulative_return':(day['adjclose'] / response.data['prices'][response.data['prices'].length -1]['adjclose']).toFixed(4) -1, 'date': formattedDate(day['date']) })
      })
      stock_dict['data'] = data
      series.push(stock_dict)
      
    }
    series.push(getPortfolioReturn(series))
    setCompanyData(series);
    console.log("series at end of getData: ", series);
    return series
  }
    
  
  const updateTickers = (ticker) => {
    ticker = ticker.trim().toUpperCase();
    let newAllTickers = [...allTickers];
    if (!newAllTickers.includes(ticker)) newAllTickers.push(ticker);
    setAllTickers(newAllTickers);
    setCurrentInputTicker('')
  }
  
  
  return (
    <div className="App">
      <h2>Portfolio Visualizer</h2> 
      <div className= "user-input">
        <label className="label">
        <span>Enter ticker: </span>
          <input id="input" type='text' placeholder='ticker...' value={currentInputTicker} onChange={(e) => setCurrentInputTicker(e.target.value)}
              onKeyDown={(e)=>handleKeyPress(e)}/> 
          <button id="enter" className='button' type='submit'onClick={() => updateTickers(currentInputTicker)}>Add to Portfolio</button>  
          {/* <button id="get-returns" type="submit" onClick={()=> setCompanyData(series)}> Get Portfolio Performance </button> */}
          <button id="get-returns" type="submit" onClick={()=> getData(allTickers)}> Get Portfolio Performance </button>
        </label>         
      </div>
      <div className="tickers-container">
        <div className='tickers'>
          <Tickers tickers={allTickers} />
        </div>
      </div>

      <div className="chart-container">
          {companyData.length !== 0 && <Chart chart_data={companyData} />}
      </div>
    </div>
  );
  }
export default App;
