import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import ApperIcon from '../components/ApperIcon'

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="space-y-6 sm:space-y-8"
        >
          {/* 404 Illustration */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center shadow-soft mb-6 sm:mb-8">
              <ApperIcon name="AlertTriangle" className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
            </div>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 w-2 h-2 bg-red-300 rounded-full animate-ping"></div>
          </motion.div>

          {/* Error Message */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-3 sm:space-y-4"
          >
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold text-surface-900 dark:text-surface-100">
              404
            </h1>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-surface-800 dark:text-surface-200">
              Page Not Found
            </h2>
            <p className="text-surface-600 dark:text-surface-400 text-sm sm:text-base lg:text-lg leading-relaxed">
              The page you're looking for doesn't exist or has been moved. 
              Let's get you back to organizing your tasks!
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center"
          >
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-medium px-6 py-3 rounded-xl transition-all duration-200 shadow-card hover:shadow-soft transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <ApperIcon name="Home" className="w-4 h-4" />
              Back to Home
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center gap-2 bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 font-medium px-6 py-3 rounded-xl transition-all duration-200 shadow-card hover:shadow-soft"
            >
              <ApperIcon name="ArrowLeft" className="w-4 h-4" />
              Go Back
            </button>
          </motion.div>

          {/* Decorative Elements */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="relative mt-8 sm:mt-12"
          >
            <div className="absolute top-0 left-4 w-1 h-1 bg-primary rounded-full animate-pulse"></div>
            <div className="absolute top-4 right-8 w-1 h-1 bg-secondary rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute bottom-2 left-1/3 w-1 h-1 bg-accent rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default NotFound