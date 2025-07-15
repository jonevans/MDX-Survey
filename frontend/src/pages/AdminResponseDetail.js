import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import Logo from '../components/Logo';
import surveyData from '../config/surveyData';
import API_URL from '../config/api';

// Helper function to format category ID to human readable format
const formatCategoryName = (categoryId) => {
  if (!categoryId) return '';
  // Split by capital letters and join with spaces
  return categoryId
    .split(/(?=[A-Z])/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const AdminResponseDetail = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams();
  const [responseData, setResponseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sentimentAnalysis, setSentimentAnalysis] = useState({});
  const [sentimentLoading, setSentimentLoading] = useState(false);
  const [sentimentError, setSentimentError] = useState(null);
  const [generatedInsights, setGeneratedInsights] = useState(null);

  useEffect(() => {
    // Redirect if not admin
    if (user && !user.isAdmin) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchResponseDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get the auth token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await axios.get(`${API_URL}/api/admin/responses/${id}`, {
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        });

        if (response.data) {
          setResponseData(response.data);
        }
      } catch (err) {
        console.error('Error fetching response details:', err);
        setError('Failed to load response details');
      } finally {
        setLoading(false);
      }
    };

    if (user && user.isAdmin && id) {
      fetchResponseDetails();
    }
  }, [user, id]);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  // Function to get comprehensive AI analysis
  const getComprehensiveAnalysis = async () => {
    try {
      setSentimentLoading(true);
      setSentimentError(null);

      const response = await axios.post(`${API_URL}/api/ai/analyze-complete`, {
        responseId: id
      }, {
        headers: {
          'x-auth-token': localStorage.getItem('token'),
          'Content-Type': 'application/json'
        }
      });

      
      if (response.data.success && response.data.analysis) {
        setSentimentAnalysis(response.data.analysis.sentimentAnalysis || {});
        setGeneratedInsights(response.data.analysis.overallInsights || null);
      } else {
        setSentimentError('Received unexpected response format from AI service');
      }

    } catch (error) {
      setSentimentError('Failed to generate AI analysis. Please try again.');
    } finally {
      setSentimentLoading(false);
    }
  };

  // Add a button to trigger AI analysis
  const handleAnalyzeWithAI = () => {
    getComprehensiveAnalysis();
  };
  
  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Logo />
          <button 
            onClick={handleLogout}
            style={{
              backgroundColor: '#DC0032',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
        <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading response details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Logo />
          <button 
            onClick={handleLogout}
            style={{
              backgroundColor: '#DC0032',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
        <div style={{ textAlign: 'center', marginTop: '50px', color: 'red' }}>{error}</div>
      </div>
    );
  }

  if (!responseData) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Logo />
          <button 
            onClick={handleLogout}
            style={{
              backgroundColor: '#DC0032',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
        <div style={{ textAlign: 'center', marginTop: '50px' }}>No response data found</div>
      </div>
    );
  }

  const { response, report, userDetails } = responseData;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ 
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: '20px',
        marginBottom: '30px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Logo />
            <h1 style={{ 
              color: '#2D2D2D', 
              margin: 0,
              fontSize: '24px',
              fontWeight: 'bold'
            }}>Response Details</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ 
              color: '#2D2D2D',
              fontWeight: '500'
            }}>Admin: {user?.fullName}</span>
            <button 
              onClick={handleLogout}
              style={{
                backgroundColor: '#DC0032',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Logout
            </button>
          </div>
        </div>

        <div style={{ 
          display: 'flex',
          gap: '10px'
        }}>
          <Link 
            to="/admin/responses" 
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#f8f9fa', 
              color: '#2D2D2D', 
              textDecoration: 'none',
              borderRadius: '4px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <span style={{ fontSize: '18px' }}>←</span>
            Back to Responses
          </Link>
          
          <button
            onClick={handleAnalyzeWithAI}
            disabled={sentimentLoading}
            style={{
              padding: '10px 20px',
              backgroundColor: sentimentLoading ? '#e9ecef' : '#DC0032',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontWeight: '500',
              cursor: sentimentLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            {sentimentLoading ? 'Analyzing...' : '🤖 Generate AI Analysis'}
          </button>
        </div>
      </div>
      
      {/* Response Summary */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '20px', marginBottom: '30px' }}>
        <h2 style={{ color: '#2D2D2D', marginBottom: '15px' }}>Summary</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <p><strong>Company:</strong> {response.companyName}</p>
            <p><strong>Completed:</strong> {new Date(response.completionDate).toLocaleString()}</p>
            <p><strong>Maturity Level:</strong> {report.maturityLevel?.name || response.scoringSummary?.maturityLevel || 'Unknown'}</p>
          </div>
          <div>
            <p><strong>User:</strong> {userDetails?.fullName || 'Unknown'}</p>
            <p><strong>Email:</strong> {userDetails?.email || 'Unknown'}</p>
            <p><strong>Total Score:</strong> {(report.scoringSummary?.totalScore || 0).toFixed(2)}/135</p>
          </div>
        </div>
      </div>
      
      {/* Category Scores */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '20px', marginBottom: '30px' }}>
        <h2 style={{ color: '#2D2D2D', marginBottom: '15px' }}>Category Scores</h2>
        <div>
          {report.scoringSummary?.categoryScores && Object.entries(report.scoringSummary.categoryScores).map(([categoryId, score]) => {
            const categoryInfo = report.categoryDetails?.[categoryId] || {};
            const categoryFeedback = response.categoryFeedback?.[categoryId] || {};
            
            return (
              <div key={categoryId} style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '5px', marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <h3 style={{ margin: 0, color: '#2D2D2D' }}>{categoryInfo.name || formatCategoryName(categoryId)}</h3>
                  <span style={{ color: '#2D2D2D' }}>{(typeof score === 'number' ? score.toFixed(2) : '0.00')}/5</span>
                </div>
                <div style={{ height: '8px', backgroundColor: '#e9ecef', borderRadius: '4px', marginBottom: '10px' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${(typeof score === 'number' ? (score / 5) * 100 : 0)}%`,
                      backgroundColor: '#DC0032',
                      borderRadius: '4px'
                    }}
                  ></div>
                </div>
                <p style={{ color: '#2D2D2D', marginBottom: '15px' }}>{categoryInfo.description || 'No description available'}</p>

                {/* Category Feedback */}
                {(categoryFeedback.strengths || categoryFeedback.challenges || 
                  categoryFeedback.context || categoryFeedback.examples) && (
                  <div style={{ marginTop: '15px' }}>
                    {categoryFeedback.strengths && (
                      <div style={{ marginBottom: '10px' }}>
                        <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#2D2D2D' }}>Strengths</p>
                        <p style={{ margin: 0, color: '#2D2D2D', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px' }}>
                          {categoryFeedback.strengths}
                        </p>
                      </div>
                    )}
                    
                    {categoryFeedback.challenges && (
                      <div style={{ marginBottom: '10px' }}>
                        <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#2D2D2D' }}>Challenges</p>
                        <p style={{ margin: 0, color: '#2D2D2D', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px' }}>
                          {categoryFeedback.challenges}
                        </p>
                      </div>
                    )}
                    
                    {categoryFeedback.context && (
                      <div style={{ marginBottom: '10px' }}>
                        <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#2D2D2D' }}>Context</p>
                        <p style={{ margin: 0, color: '#2D2D2D', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px' }}>
                          {categoryFeedback.context}
                        </p>
                      </div>
                    )}
                    
                    {categoryFeedback.examples && (
                      <div style={{ marginBottom: '10px' }}>
                        <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#2D2D2D' }}>Examples</p>
                        <p style={{ margin: 0, color: '#2D2D2D', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px' }}>
                          {categoryFeedback.examples}
                        </p>
                      </div>
                    )}
                    
                    {/* AI Sentiment Analysis */}
                    {(categoryFeedback.strengths || categoryFeedback.challenges || 
                      categoryFeedback.context || categoryFeedback.examples) && (
                      <div style={{ 
                        marginTop: '20px',
                        backgroundColor: '#f8f9fa',
                        padding: '15px',
                        borderRadius: '4px',
                        border: '1px solid #e9ecef'
                      }}>
                        <p style={{ 
                          margin: '0 0 10px 0',
                          fontWeight: 'bold',
                          color: '#2D2D2D',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <span>🤖 AI Sentiment Analysis</span>
                          {sentimentLoading && (
                            <span style={{ 
                              fontSize: '14px',
                              color: '#6c757d',
                              fontWeight: 'normal'
                            }}>
                              (Analyzing...)
                            </span>
                          )}
                        </p>
                        {sentimentError ? (
                          <div style={{ 
                            color: '#DC0032',
                            fontSize: '14px'
                          }}>
                            {sentimentError}
                          </div>
                        ) : sentimentLoading ? (
                          <div style={{ 
                            color: '#6c757d',
                            fontSize: '14px',
                            fontStyle: 'italic'
                          }}>
                            Please wait while we analyze all responses...
                          </div>
                        ) : sentimentAnalysis[categoryId] ? (
                          <div style={{ 
                            color: '#2D2D2D',
                            whiteSpace: 'pre-line'
                          }}>
                            {sentimentAnalysis[categoryId]}
                          </div>
                        ) : (
                          <div style={{ 
                            color: '#6c757d',
                            fontSize: '14px',
                            fontStyle: 'italic'
                          }}>
                            Click "Generate AI Analysis" above to analyze this category's sentiment
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* AI-Generated Insights */}
      {(response.scoringSummary?.aiInsights || report.aiInsights || generatedInsights) && (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '20px', marginBottom: '30px' }}>
          <h2 style={{ color: '#2D2D2D', marginBottom: '15px' }}>AI-Generated Insights</h2>
          
          {(() => {
            const insights = response.scoringSummary?.aiInsights || report.aiInsights || generatedInsights;
            
            return (
              <>
                {insights.summary && (
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ color: '#2D2D2D', marginBottom: '10px' }}>Summary</h3>
                    <p style={{ color: '#2D2D2D' }}>{insights.summary}</p>
                  </div>
                )}
                
                {insights.keyFindings && insights.keyFindings.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ color: '#2D2D2D', marginBottom: '10px' }}>Key Findings</h3>
                    <ul style={{ paddingLeft: '20px' }}>
                      {insights.keyFindings.map((finding, index) => (
                        <li key={index} style={{ marginBottom: '10px', color: '#2D2D2D' }}>{finding}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {insights.recommendations && insights.recommendations.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ color: '#2D2D2D', marginBottom: '10px' }}>Recommendations</h3>
                    <ul style={{ paddingLeft: '20px' }}>
                      {insights.recommendations.map((recommendation, index) => (
                        <li key={index} style={{ marginBottom: '10px', color: '#2D2D2D' }}>{recommendation}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {(insights.nextSteps || insights.actionItems) && (insights.nextSteps || insights.actionItems).length > 0 && (
                  <div>
                    <h3 style={{ color: '#2D2D2D', marginBottom: '10px' }}>Next Steps</h3>
                    <ul style={{ paddingLeft: '20px' }}>
                      {(insights.nextSteps || insights.actionItems).map((step, index) => (
                        <li key={index} style={{ marginBottom: '10px', color: '#2D2D2D' }}>{step}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
      
      {/* Show message if no AI insights available */}
      {!(response.scoringSummary?.aiInsights || report.aiInsights || generatedInsights) && (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '20px', marginBottom: '30px' }}>
          <h2 style={{ color: '#2D2D2D', marginBottom: '15px' }}>🤖 AI-Generated Insights</h2>
          <p style={{ color: '#666', fontStyle: 'italic', marginBottom: '15px' }}>
            AI insights were not generated for this response yet. Click the "Generate AI Analysis" button above to create comprehensive insights and sentiment analysis.
          </p>
          {sentimentError && (
            <div style={{ 
              color: '#DC0032',
              fontSize: '14px',
              backgroundColor: '#fff5f5',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #fecaca'
            }}>
              Error: {sentimentError}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminResponseDetail; 