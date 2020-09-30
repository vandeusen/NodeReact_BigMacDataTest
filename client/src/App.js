import React, { Component } from 'react';
import './App.css';
import CurrencyInput from 'react-currency-input';

class App extends Component {
  state = {
    country: '',
    amount: '',
    responseToPost: ''
  };

  componentDidMount() {
    this.callApi()
      .then(res => this.setState({ country: res.data.country_name }))
      .catch(err => console.log(err));
  }

  callApi = async () => {
    const response = await fetch('/api/fetchIP');
    const body = await response.json();
    //console.log(body);
    if (response.status !== 200) throw Error(body.message);

    return body;
  };
  
  handleSubmit = async e => {
    e.preventDefault();
    const response = await fetch('/api/checkBigMac', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ post: this.state.amount, country: this.state.country}),
    });
    const body = await response.text();
    
    this.setState({ responseToPost: body });
  };
  
  handleChange(event, maskedvalue, floatvalue){
    this.setState({amount: maskedvalue});
};

render() {
    return (
      <div className="App">
        <h1>You are in {this.state.country}</h1>
        <form class='currencyInputForm' onSubmit={this.handleSubmit}>
          <p>
            Please enter an amount of money in your local currency:
          </p>
          <CurrencyInput prefix="$" value={this.state.amount} onChangeEvent={this.handleChange.bind(this)}/>
          <button type="submit">Submit</button>
        </form>
        <div dangerouslySetInnerHTML={{ __html: this.state.responseToPost }} />
      </div>
    );
  }
}

export default App;