import React, { useState } from 'react';
import './login.css';

function CreateAccount() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [last_name, setLastName] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    const response = await fetch('/create_account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
   
        email,
        first_name: firstName,
        last_name: last_name,
        login:{
            username,
            password,
        }
      }),
    });

    const data = await response.json();

    if (data.success) {
      alert('Account created successfully');
    } else {
      alert('Error: ' + data.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="form">
      <label>
        Username:
        <input type="text" class="input" value={username} onChange={(e) => setUsername(e.target.value)} required />
      </label>
      <label>
        Password:
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </label>
      <label>
        Email:
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <label>
        First Name:
        <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
      </label>
      <label>
        Last Name:
        <input type="text" value={last_name} onChange={(e) => setLastName(e.target.value)} required />
      </label>
      <button type="submit">Create Account</button>
    </form>
  );
}

export default CreateAccount;