import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Information.css';

function Information() {
    const navigate = useNavigate();
    const [fukuokaTime, setFukuokaTime] = useState('');
    const [exchangeRates, setExchangeRates] = useState({});
    const [selectedCurrency, setSelectedCurrency] = useState('');
    const [amount, setAmount] = useState(0);
    const [convertedAmount, setConvertedAmount] = useState(0);
    const [senderCountry, setSenderCountry] = useState('');
    const [receiverCountry, setReceiverCountry] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            const fukuokaDate = new Date().toLocaleTimeString('en-US', {
                timeZone: 'Asia/Tokyo',
                hour12: true,
                hour: '2-digit',
                minute: '2-digit'
            });
            setFukuokaTime(fukuokaDate);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        axios.get('/api/exchange-rate')  // 환율 정보 가져오기
            .then(response => {
                setExchangeRates(response.data);
            })
            .catch(error => {
                console.error('Error fetching exchange rates:', error);
            });
    }, []);

    const handleCurrencyChange = (event) => {
        setSelectedCurrency(event.target.value);
    };

    const handleAmountChange = (event) => {
        setAmount(parseFloat(event.target.value));
    };

    const handleSenderCountryChange = (event) => {
        setSenderCountry(event.target.value);
    };

    const handleReceiverCountryChange = (event) => {
        setReceiverCountry(event.target.value);
    };

    const handleConvert = () => {
        if (selectedCurrency && exchangeRates[selectedCurrency]) {
            const rate = exchangeRates[selectedCurrency].buy;
            setConvertedAmount(amount * rate);
        }
    };

    const handleClick = () => {
        navigate('/home');
    };

    return (
        <div className="container">
            <button onClick={handleClick} style={{ cursor: 'pointer', border: 'none', background: 'none', width: '300px', display: 'block', margin: '0 auto', outline: 'none' }}>
                <img src="Home.jpg" alt="Go to Home" style={{ width: '250px', height: '120px' }} />
            </button>
            <div className="clock">{fukuokaTime}</div>
            <div className="exchange-calculator">
                <h2>환율 계산기</h2>
                <div>
                    <label>송금 국가:</label>
                    <select value={senderCountry} onChange={handleSenderCountryChange}>
                        <option value="">송금 국가를 선택하세요</option>
                        <option value="Korea">대한민국 (KRW)</option>
                        <option value="Japan">일본 (JPY)</option>
                        <option value="China">중국 (CNY)</option>
                        <option value="Europe">유럽 (EUR)</option>
                    </select>
                </div>
                <div>
                    <label>수취 국가:</label>
                    <select value={receiverCountry} onChange={handleReceiverCountryChange}>
                        <option value="">수취 국가를 선택하세요</option>
                        <option value="Korea">대한민국 (KRW)</option>
                        <option value="Japan">일본 (JPY)</option>
                        <option value="China">중국 (CNY)</option>
                        <option value="Europe">유럽 (EUR)</option>
                    </select>
                </div>
                <div>
                    <label>환율 선택:</label>
                    <select value={selectedCurrency} onChange={handleCurrencyChange}>
                        <option value="">환율을 선택하세요</option>
                        {Object.keys(exchangeRates).map(currency => (
                            <option key={currency} value={currency}>{currency}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label>송금 금액:</label>
                    <input type="number" value={amount} onChange={handleAmountChange} />
                </div>
                <button onClick={handleConvert}>변환</button>
                {convertedAmount > 0 && (
                    <div>
                        <label>수취 국가로 변환된 금액:</label>
                        <span>{convertedAmount} {selectedCurrency}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Information;