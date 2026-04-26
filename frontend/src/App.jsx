import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [jokes, setJokes] = useState([])

  useEffect(()=>{
    axios.get('/jokes')
    .then((res) => {
      setJokes(res.data)
     .catch((err)=> {
      console.log(err);
      
     }) 
    })
  },[])
  
  return (
    <>
      <section id="center">
        <h1>Hello Night with Backend</h1>
        <p>Jokes : {jokes.length}</p>
        {
          jokes.map((joke) => (
            <div key={joke.id}>
              <h3>{joke.title}</h3> 
              <p>{joke.content}</p>
            </div>
          ))
        }
      </section>
    </>
  )
}

export default App