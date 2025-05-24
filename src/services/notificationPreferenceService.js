const { ApperClient } = window.ApperSDK

const apperClient = new ApperClient({
  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
})

const TABLE_NAME = 'notification_preference1'

// All fields for fetch operations
const ALL_FIELDS = [
  'Id', 'Name', 'Tags', 'Owner', 'CreatedOn', 'CreatedBy', 'ModifiedOn', 'ModifiedBy',
  'enableBrowser', 'overdueTasks', 'dueTodayTasks', 'upcomingDeadlines', 'taskCompletions', 'reminderTiming'
]

// Only updateable fields for create/update operations
const UPDATEABLE_FIELDS = [
  'Name', 'Tags', 'Owner', 'enableBrowser', 'overdueTasks', 'dueTodayTasks', 'upcomingDeadlines', 'taskCompletions', 'reminderTiming'
]

export const notificationPreferenceService = {
  // Fetch user's notification preferences
  async fetchUserPreferences(userId) {
    try {
      const params = {
        fields: ALL_FIELDS,
        where: [
          {
            fieldName: 'Owner',
            operator: 'EqualTo',
            values: [userId]
          }
        ]
      }

      const response = await apperClient.fetchRecords(TABLE_NAME, params)
      
      // Return first preference record or null if none exists
      return response?.data?.[0] || null
    } catch (error) {
      console.error('Error fetching notification preferences:', error)
      throw error
    }
  },

  // Get preference by ID
  async getPreferenceById(preferenceId) {
    try {
      const params = {
        fields: ALL_FIELDS
      }

      const response = await apperClient.getRecordById(TABLE_NAME, preferenceId, params)
      return response?.data || null
    } catch (error) {
      console.error(`Error fetching preference with ID ${preferenceId}:`, error)
      throw error
    }
  },

  // Create new notification preferences
  async createPreferences(preferenceData) {
    try {
      // Filter to only include updateable fields
      const filteredData = {}
      UPDATEABLE_FIELDS.forEach(field => {
        if (preferenceData.hasOwnProperty(field) && preferenceData[field] !== undefined) {
          filteredData[field] = preferenceData[field]
        }
      })

      const params = {
        records: [filteredData]
      }

      const response = await apperClient.createRecord(TABLE_NAME, params)
      
      if (response?.success && response?.results?.[0]?.success) {
        return response.results[0].data
      } else {
        throw new Error(response?.results?.[0]?.message || 'Failed to create preferences')
      }
    } catch (error) {
      console.error('Error creating notification preferences:', error)
      throw error
    }
  },

  // Update existing notification preferences
  async updatePreferences(preferenceId, preferenceData) {
    try {
      // Filter to only include updateable fields
      const filteredData = { Id: preferenceId }
      UPDATEABLE_FIELDS.forEach(field => {
        if (preferenceData.hasOwnProperty(field) && preferenceData[field] !== undefined) {
          filteredData[field] = preferenceData[field]
        }
      })

      const params = {
        records: [filteredData]
      }

      const response = await apperClient.updateRecord(TABLE_NAME, params)
      
      if (response?.success && response?.results?.[0]?.success) {
        return response.results[0].data
      } else {
        throw new Error(response?.results?.[0]?.message || 'Failed to update preferences')
      }
    } catch (error) {
      console.error('Error updating notification preferences:', error)
      throw error
    }
  }
}