import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import './AddCard.css';


const AddCard = () => {

  const apiUrl = "https://fintech-cards.azurewebsites.net";
    const [redirectToLogin, setRedirectToLogin] = useState(false);
        const navigate = useNavigate();
      
      
  const [card, setCard] = useState({
    number: '',
    expiry_month: '',
    expiry_year: '',
    institution: '',
    reward_type: '',
    reward_value: '',
    cardholderName: '',
    meta_data: {}
  });
  


  const handleChange = (e) => {
    setCard({
      ...card,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Add Card button clicked');

    console.log('Card:', card);
    console.log(localStorage.getItem('Id'));
    console.log(localStorage.getItem('isLoggedIn'));

    // Check if the user is logged in
    if(localStorage.getItem('Id') === null || !localStorage.getItem('isLoggedIn')) {
        console.log('User is not logged in');
        alert('Please log in to add a card');
        setRedirectToLogin(true);
    }

    // Make a POST request to the /add_credit_card endpoint
    fetch(`${apiUrl}/add_credit_card`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: localStorage.getItem('Id'),
        card: card
      }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log('Card added successfully');
        alert('Card added successfully');
        navigate('/dashboard');
        // You can clear the form here if you want
        setCard({
          number: '',
          expiry_month: '',
          expiry_year: '',
          institution: '',
          reward_type: '',
          reward_value: '',
          cardholderName: '',
          meta_data: {}
        });
      } else {
        console.log('Failed to add card');
      }
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  };
  const handleDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <>
    {redirectToLogin && <Navigate to="/login" />}
    <div className="add-card-container">
    <form className='add-card-form' onSubmit={handleSubmit}>
      <label>
        Card Number:
        <input className='add-card-input' type="text" name="number" value={card.number} onChange={handleChange} required />
      </label>
      <label>
        Expiry Month:
        <input  className='add-card-input'  type="text" name="expiry_month" value={card.expiry_month} onChange={handleChange} required />
      </label>
      <label>
        Expiry Year:
        <input  className='add-card-input'  type="text" name="expiry_year" value={card.expiry_year} onChange={handleChange} required />
      </label>
      <label>
        Institution:
        <input  className='add-card-input'  type="text" name="institution" value={card.institution} onChange={handleChange} required />
      </label>
      <label>
        Reward Type:
        <input  className='add-card-input'  type="text" name="reward_type" value={card.reward_type} onChange={handleChange} required />
      </label>
      <label>
        Reward Value:
        <input  className='add-card-input'  type="text" name="reward_value" value={card.reward_value} onChange={handleChange} required />
      </label>
      <label>
        Cardholder Name:
        <input  className='add-card-input'  type="text" name="cardholderName" value={card.cardholderName} onChange={handleChange} required />
      </label>
      <input className='button' type="submit" value="Add Card" />
      <button className="button" onClick={handleDashboard}>Dashboard</button>
    </form>
    </div>
    </>
  );
  };
export default AddCard;