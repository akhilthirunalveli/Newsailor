import React, { useRef } from 'react'
import { assets } from '../assets/assets'
import { useAppContext } from '../context/AppContext'

const Navbar = () => {
    const { navigate, token } = useAppContext()
    const inputRef = useRef(null)

    const onSubmitHandler = (e) => {
        e.preventDefault()
        // Add your search logic here
        const searchTerm = inputRef.current.value
        console.log('Searching for:', searchTerm)
        // Example: navigate to search results
        // navigate(`/search?q=${encodeURIComponent(searchTerm)}`)
    }

    return (
        <div className='flex justify-between items-center py-5 mx-8 sm:mx-20 xl:mx-32'>

          <h1 className='w-32 sm:w-40 cursor-pointer text-3xl font-bold text-blue-600 hover:text-blue-800 transition-colors' onClick={()=> navigate('/')}>
  NewsSailor
</h1>
            <form onSubmit={onSubmitHandler} className='flex justify-right border border-gray-300 bg-white rounded overflow-hidden'>
                <input 
                    ref={inputRef} 
                    type="text" 
                    placeholder='Search for article' 
                    required 
                    className='w-full pl-4 outline-none'
                />
                <button type="submit" className='bg-primary text-white px-8 py-2 m-1.5 rounded hover:scale-105 transition-all cursor-pointer'>
                    Search
                </button>
            </form>

            {/* <button 
                onClick={() => navigate('/admin')}  
                className='flex items-center gap-2 rounded-full text-sm cursor-pointer bg-primary text-white px-10 py-2.5'
            >
                {token ? 'Dashboard' : 'Login'}
                <img src={assets.arrow} className='w-3' alt="arrow" />
            </button> */}
        </div>
    )
}

export default Navbar