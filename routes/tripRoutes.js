// routes/tripRoutes.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');

module.exports = (connection) => {
   // Get all trips for a user
   router.get('/', verifyToken, (req, res) => {
       try {
           const userId = req.user.user_id;

           connection.query(
               'SELECT * FROM trips WHERE user_id = ?',
               [userId],
               (error, results) => {
                   if (error) {
                       console.error('Database error:', error);
                       return res.status(500).json({
                           success: false,
                           message: "Internal server error"
                       });
                   }

                   res.json({
                       success: true,
                       message: "Trips retrieved successfully",
                       trips: results
                   });
               }
           );

       } catch (error) {
           console.error('Trips fetch error:', error);
           res.status(500).json({
               success: false,
               message: "Internal server error"
           });
       }
   });

   // Get total distance travelled by user
   router.get('/total-distance', verifyToken, (req, res) => {
       try {
           const userId = req.user.user_id;

           connection.query(
               'SELECT SUM(distance_travelled) as total_distance FROM trips WHERE user_id = ?',
               [userId],
               (error, results) => {
                   if (error) {
                       console.error('Database error:', error);
                       return res.status(500).json({
                           success: false,
                           message: "Internal server error"
                       });
                   }

                   const totalDistance = results[0].total_distance || 0;

                   res.json({
                       success: true,
                       message: "Total distance retrieved successfully",
                       total_distance: totalDistance,
                       formatted_distance: `${totalDistance} km`
                   });
               }
           );

       } catch (error) {
           console.error('Total distance fetch error:', error);
           res.status(500).json({
               success: false,
               message: "Internal server error"
           });
       }
   });

   // Modified add trip endpoint with required fields
   router.post('/add', verifyToken, (req, res) => {
       try {
           const userId = req.user.user_id;
           const {
               fleet_id,
               start_time,
               end_time,
               distance_travelled,
               duration_minutes,
               status
           } = req.body;

           // Validate required fields
           if (!fleet_id || !start_time || !end_time || !distance_travelled || !duration_minutes || !status) {
               return res.status(400).json({
                   success: false,
                   message: "Required fields: fleet_id, start_time, end_time, distance_travelled, duration_minutes, and status"
               });
           }

           // Validate status value
           const validStatuses = ['in_progress', 'completed', 'cancelled'];
           if (!validStatuses.includes(status)) {
               return res.status(400).json({
                   success: false,
                   message: "Status must be one of: in_progress, completed, cancelled"
               });
           }

           const query = `
               INSERT INTO trips (
                   user_id,
                   fleet_id,
                   start_time,
                   end_time,
                   distance_travelled,
                   duration_minutes,
                   status
               ) VALUES (?, ?, ?, ?, ?, ?, ?)
           `;

           const values = [
               userId,
               fleet_id,
               start_time,
               end_time,
               distance_travelled,
               duration_minutes,
               status
           ];

           connection.query(query, values, (error, results) => {
               if (error) {
                   console.error('Database error:', error);
                   return res.status(500).json({
                       success: false,
                       message: "Internal server error",
                       error: error.message
                   });
               }

               res.status(201).json({
                   success: true,
                   message: "Trip added successfully",
                   trip_id: results.insertId
               });
           });

       } catch (error) {
           console.error('Trip addition error:', error);
           res.status(500).json({
               success: false,
               message: "Internal server error"
           });
       }
   });

   return router;
};