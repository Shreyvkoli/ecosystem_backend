import axios from 'axios';

async function test() {
  try {
    const loginRes = await axios.post('https://ecosystem-backend-1.onrender.com/api/auth/login', {
      email: 'e1@gmail.com',
      password: '123456789'
    });
    
    const token = loginRes.data.token;
    
    console.log('Fetching available orders...');
    const res = await axios.get('https://ecosystem-backend-1.onrender.com/api/orders?status=OPEN', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Response status:', res.status);
    console.log('Orders returned:', res.data.length);
  } catch (err: any) {
    console.error('Error:', err.response?.status, err.response?.data || err.message);
  }
}

test();
