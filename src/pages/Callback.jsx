import React, { useEffect } from 'react'

const Callback = () => {
  useEffect(() => {
    const { ApperUI } = window.ApperSDK
    ApperUI.showSSOVerify("#authentication-callback")
  }, [])

  return (
    <div>
      <div id="authentication-callback"></div>
    </div>
  )
}

export default Callback