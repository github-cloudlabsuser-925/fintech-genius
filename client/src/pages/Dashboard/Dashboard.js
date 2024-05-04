import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import './Dashboard.css';




function Dashboard() {
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const apiUrl = "https://fintech-cards.azurewebsites.net";



  useEffect(() => {
    fetch(`${apiUrl}/get_credit_cards/${localStorage.getItem('Id')}`)
      .then(response => response.json())
      .then(data => setCards(data));
  }, [apiUrl]);


  const handleAddCard = () => {
    console.log('Add Card button clicked');
    navigate('/add-card');
            // Add your logic for adding a card here
  };

  async function handleRemoveCard(cardNumber) {
    // Call the API endpoint to remove the card
    const response = await fetch(`${apiUrl}/remove_credit_card/${localStorage.getItem('Id')}/${cardNumber}`, {
      method: 'DELETE',
    });
  
    if (response.ok) {
      // If the card was removed successfully, fetch the updated list of cards
      const updatedCards = await fetch(`/get_credit_cards/${localStorage.getItem('Id')}`);
      if (updatedCards.ok) {
        // Update the state of your component with the updated list of cards
        const cardsData = await updatedCards.json();
        setCards(cardsData);
      }
    }
  }

  const handleLogout = async () => {
    console.log('Logout button clicked');
  
    const response = await fetch(`${apiUrl}/logout`, {
      method: 'POST',
    });
  
    const data = await response.json();
  
    if (data.success) {
      console.log('Logout successful');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('Id');
      navigate('/');
    } else {
      alert('Logout failed');
    }
  };

  return (
    <div>
      <button className="button logout" onClick={handleLogout}>Logout</button>
      <h1>Dashboard</h1>
      <button className="button"  onClick={handleAddCard}>Add Card</button>

      <table className='table'>
        <thead>
          <tr>
            <th>Card Number</th>
            <th>Expiry</th>
            <th>Institution</th>
            <th>Reward Type</th>
          </tr>
        </thead>
        <tbody>
          {cards.map((card) => (
            <tr key={card.number} className='card-row'>
              <td>{card.number}</td>
              <td>{card.expiry_year} / {card.expiry_month} </td>
              <td>{card.institution}</td>
              <td>{card.reward_type}</td>
              <td>
                  <button className="remove-button" onClick={() => handleRemoveCard(card.number)}>Remove</button>
            </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Dashboard;