// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports = (connection) => {
  // Login endpoint
  router.post('/login', async (req, res) => {
      try {
          if (!req.is('application/json')) {
              return res.status(400).json({
                  success: false,
                  message: "Content-Type must be application/json"
              });
          }

          const { username, password } = req.body;

          if (!username || !password) {
              return res.status(400).json({
                  success: false,
                  message: "Username and password are required"
              });
          }

          connection.query(
              'SELECT id, username, password_hash FROM users WHERE username = ?',
              [username],
              async (error, results) => {
                  if (error) {
                      console.error('Database error:', error);
                      return res.status(500).json({
                          success: false,
                          message: "Internal server error"
                      });
                  }

                  if (results.length === 0) {
                      return res.status(401).json({
                          success: false,
                          message: "Invalid username or password"
                      });
                  }

                  const user = results[0];
                  const isValidPassword = await bcrypt.compare(password, user.password_hash);
                  
                  if (!isValidPassword) {
                      return res.status(401).json({
                          success: false,
                          message: "Invalid username or password"
                      });
                  }

                  const token = jwt.sign(
                      { user_id: user.id, username: user.username },
                      process.env.JWT_SECRET,
                      { expiresIn: '24h' }
                  );

                  res.json({
                      success: true,
                      message: "Login successful!",
                      token
                  });
              }
          );
      } catch (error) {
          console.error('Login error:', error);
          res.status(500).json({
              success: false,
              message: "Internal server error"
          });
      }
  });

  // Signup endpoint
  router.post('/signup', async (req, res) => {
      try {
          if (!req.is('application/json')) {
              return res.status(400).json({
                  success: false,
                  message: "Content-Type must be application/json"
              });
          }

          const {
              username,
              email,
              password,
              password_verify,
              first_name,
              last_name,
              phone,
              date_of_birth,
              profile_image,
              bio
          } = req.body;

          // Validate required fields
          if (!username || !email || !password || !password_verify || !first_name || !last_name) {
              return res.status(400).json({
                  success: false,
                  message: "Username, email, password, password verification, first name, and last name are required"
              });
          }

          // Verify passwords match
          if (password !== password_verify) {
              return res.status(400).json({
                  success: false,
                  message: "Passwords do not match"
              });
          }

          // Check if username or email already exists
          connection.query(
              'SELECT id FROM users WHERE username = ? OR email = ?',
              [username, email],
              async (error, results) => {
                  if (error) {
                      console.error('Database error:', error);
                      return res.status(500).json({
                          success: false,
                          message: "Internal server error"
                      });
                  }

                  if (results.length > 0) {
                      return res.status(409).json({
                          success: false,
                          message: "Username or email already exists"
                      });
                  }

                  try {
                      // Hash password
                      const salt = await bcrypt.genSalt(10);
                      const password_hash = await bcrypt.hash(password, salt);

                      // Insert new user
                      const query = `
                          INSERT INTO users (
                              username,
                              email,
                              password_hash,
                              first_name,
                              last_name,
                              phone,
                              date_of_birth,
                              profile_image,
                              bio
                          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                      `;

                      const values = [
                          username,
                          email,
                          password_hash,
                          first_name,
                          last_name,
                          phone || null,
                          date_of_birth || null,
                          profile_image || null,
                          bio || null
                      ];

                      connection.query(query, values, (error, results) => {
                          if (error) {
                              console.error('Database error:', error);
                              return res.status(500).json({
                                  success: false,
                                  message: "Internal server error"
                              });
                          }

                          // Create JWT token for auto-login
                          const token = jwt.sign(
                              { 
                                  user_id: results.insertId, 
                                  username: username 
                              },
                              process.env.JWT_SECRET,
                              { expiresIn: '24h' }
                          );

                          res.status(201).json({
                              success: true,
                              message: "User registered successfully",
                              token,
                              user: {
                                  id: results.insertId,
                                  username,
                                  email,
                                  first_name,
                                  last_name
                              }
                          });
                      });

                  } catch (hashError) {
                      console.error('Password hashing error:', hashError);
                      return res.status(500).json({
                          success: false,
                          message: "Error creating user"
                      });
                  }
              }
          );

      } catch (error) {
          console.error('Signup error:', error);
          res.status(500).json({
              success: false,
              message: "Internal server error"
          });
      }
  });

  // Get user details from token
  router.get('/me', async (req, res) => {
      try {
          // Get token from header
          const authHeader = req.headers['authorization'];
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
              return res.status(401).json({
                  success: false,
                  message: "Bearer token is required"
              });
          }

          const token = authHeader.split(' ')[1];

          // Verify token
          const decoded = jwt.verify(token, process.env.JWT_SECRET);

          // Get user details from database
          connection.query(
              'SELECT id, username, email, first_name, last_name FROM users WHERE id = ?',
              [decoded.user_id],
              (error, results) => {
                  if (error) {
                      console.error('Database error:', error);
                      return res.status(500).json({
                          success: false,
                          message: "Internal server error"
                      });
                  }

                  if (results.length === 0) {
                      return res.status(404).json({
                          success: false,
                          message: "User not found"
                      });
                  }

                  res.json({
                      success: true,
                      user: results[0]
                  });
              }
          );

      } catch (error) {
          console.error('Token verification error:', error);
          res.status(401).json({
              success: false,
              message: "Invalid or expired token"
          });
      }
  });




  router.get('/top-travelers', async (req, res) => {
    try {
        const query = `
            SELECT 
                u.id,
                u.username,
                u.first_name,
                u.last_name,
                SUM(t.distance_travelled) as total_distance
            FROM users u
            JOIN trips t ON u.id = t.user_id
            WHERE t.status = 'completed'
            GROUP BY u.id, u.username, u.first_name, u.last_name
            ORDER BY total_distance DESC
            LIMIT 5
        `;

        connection.query(query, (error, results) => {
            if (error) {
                console.error('Database error:', error);
                return res.status(500).json({
                    success: false,
                    message: "Internal server error"
                });
            }

            // Format the results
            const formattedResults = results.map(user => ({
                id: user.id,
                username: user.username,
                first_name: user.first_name,
                last_name: user.last_name,
                total_distance: parseFloat(user.total_distance) || 0,
                formatted_distance: `${parseFloat(user.total_distance).toFixed(2)} km`
            }));

            res.json({
                success: true,
                message: "Top travelers retrieved successfully",
                travelers: formattedResults
            });
        });

    } catch (error) {
        console.error('Top travelers error:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});



  return router;
};