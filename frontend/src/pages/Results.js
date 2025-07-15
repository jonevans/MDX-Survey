import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { generateInsights } from '../services/chatgptService';
import Logo from '../components/Logo';
import html2pdf from 'html2pdf.js';
import API_URL from '../config/api';

// Import survey data configuration
const surveyData = {
  scoring: {
    maturityLevels: [
      { level: "Absent", range: [0, 27], description: "Digital transformation is not occurring or is extremely limited" },
      { level: "Limited", range: [28, 55], description: "Basic digital transformation efforts, but lacking strategy and integration" },
      { level: "Emerging", range: [56, 77], description: "Digital transformation is underway with some structure, but not comprehensive" },
      { level: "Applied", range: [78, 98], description: "Digital transformation is well-established and integrated into operations" },
      { level: "Strategic", range: [99, 125], description: "Digital transformation is a strategic priority with strong implementation" },
      { level: "Innovative", range: [126, 135], description: "Digital transformation is a core competency, driving innovation and growth" }
    ]
  }
};

// Add CSS for the spinner
const spinnerStyles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .spinner-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 80vh;
  }

  .spinner {
    width: 120px;
    height: 120px;
    animation: spin 1.5s linear infinite;
  }

  .loading-text {
    margin-top: 20px;
    color: #2D2D2D;
    font-size: 18px;
  }

  @media screen {
    .pdf-only {
      display: none !important;
    }
  }

  @media print {
    .screen-only {
      display: none !important;
    }
    .pdf-only {
      display: flex !important;
    }
  }
`;

const Results = () => {
  const { responseId } = useParams();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  
  // Add the styles to the document
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = spinnerStyles;
    document.head.appendChild(styleSheet);
    return () => styleSheet.remove();
  }, []);
  
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);
        
        
        // Get the auth token from localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('No authentication token found. Please log in again.');
        }

        const response = await axios.get(
          `${API_URL}/api/reports/${responseId}`,
          {
            headers: {
              'x-auth-token': token,
              'Content-Type': 'application/json'
            }
          }
        );
        
        
        if (!response.data) {
          throw new Error('No data received from the server');
        }
        
        setResults(response.data);
        
        // Use AI insights from the response if available
        if (response.data.aiInsights) {
          setInsights(response.data.aiInsights);
        } else {
          // Generate insights if not already present
          try {
            setInsightsLoading(true);
            setInsightsError(null);
            const generatedInsights = await generateInsights(response.data);
            if (generatedInsights) {
              setInsights(generatedInsights);
            } else {
              setInsightsError('Failed to generate insights');
            }
          } catch (insightErr) {
            console.error('Error generating insights:', insightErr);
            setInsightsError('Unable to generate insights at this time.');
          } finally {
            setInsightsLoading(false);
          }
        }
      } catch (err) {
        
        const errorMessage = err.response?.data?.message || err.message || 'Failed to load results';
        setError(errorMessage);
        
        // If token is invalid, redirect to login
        if (err.response?.status === 401) {
          localStorage.removeItem('token'); // Clear invalid token
          // You might want to redirect to login here
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchResults();
  }, [responseId]);
  
  const handleDownloadPDF = async () => {
    setGeneratingPdf(true);
    try {
      const element = document.getElementById('results-content');
      if (!element) {
        throw new Error('Content element not found');
      }

      const opt = {
        margin: [0.75, 0.75],
        filename: `digital-transformation-assessment-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: true
        },
        jsPDF: { 
          unit: 'in', 
          format: 'letter', 
          orientation: 'portrait'
        }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('There was an error generating the PDF. Please try again.');
    } finally {
      setGeneratingPdf(false);
    }
  };
  
  const handleShareViaEmail = () => {
    const subject = encodeURIComponent("Take This Survey From Impact!");
    const body = encodeURIComponent(
      "Join us in assessing our organization's digital transformation journey. Your input is valuable!\n\n" +
      "Click here to take the survey: " + window.location.origin
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };
  
  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner">
          <Logo />
        </div>
        <div className="loading-text">Loading results...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', textAlign: 'center' }}>
        <div style={{ 
          backgroundColor: '#FFF5F7', 
          color: '#DC0032', 
          padding: '10px', 
          borderRadius: '3px', 
          marginBottom: '10px',
          border: '1px solid #DC0032'
        }}>
          {error}
        </div>
        <Link
          to="/dashboard"
          style={{
            padding: '8px 15px',
            backgroundColor: '#2D2D2D',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '3px',
            display: 'inline-block',
            marginTop: '10px'
          }}
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }
  
  if (!results) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', textAlign: 'center' }}>
        <div>No results found.</div>
      </div>
    );
  }
  
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      {/* Navigation and Screen Header Combined */}
      <div className="screen-only" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Logo style={{ width: '40px', height: '40px' }} />
          <h1 style={{ 
            color: '#2D2D2D', 
            margin: 0,
            fontSize: '28px',
            fontWeight: '600'
          }}>
            Digital Transformation Assessment
          </h1>
        </div>
        <Link
          to="/dashboard"
          style={{
            padding: '8px 15px',
            backgroundColor: '#2D2D2D',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '3px',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Back to Dashboard
        </Link>
      </div>

      {/* PDF Content */}
      <div id="results-content">
        {/* PDF Header */}
        <div className="pdf-only" style={{ 
          display: 'flex',
          alignItems: 'center', 
          gap: '16px',
          marginBottom: '30px',
          paddingBottom: '20px',
          borderBottom: '1px solid #e9ecef',
          backgroundColor: 'white',
          justifyContent: 'flex-start',
          width: '100%'
        }}>
          <Logo style={{ width: '40px', height: '40px' }} />
          <h1 style={{ 
            color: '#2D2D2D', 
            margin: 0,
            fontSize: '28px',
            fontWeight: '600'
          }}>
            Digital Transformation Assessment
          </h1>
        </div>

        {/* Maturity Level Section */}
        <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'white', borderRadius: '5px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#2D2D2D', marginBottom: '10px' }}>
            Maturity Level: {results.maturityLevel?.name || 'Not Available'}
          </h2>
          <p style={{ color: '#2D2D2D', marginBottom: '15px' }}>
            {results.maturityLevel?.description || 'Description not available'}
          </p>
          
          {/* Company response count */}
          {results.companyResponseCount > 1 && (
            <p style={{ 
              color: '#2D2D2D', 
              marginBottom: '15px',
              backgroundColor: '#f8f9fa',
              padding: '10px',
              borderRadius: '5px',
              fontSize: '0.9em'
            }}>
              This assessment includes aggregated data from {results.companyResponseCount} responses within your company, providing a comprehensive view of your organization's digital transformation status.
            </p>
          )}
          
          {/* Score display above progress bar */}
          <div style={{ textAlign: 'right', marginBottom: '10px' }}>
            <span style={{ color: '#2D2D2D', fontWeight: 'bold' }}>
              Score: {(Math.min(results.scoringSummary?.totalScore || 0, 135)).toFixed(2)}/135
            </span>
          </div>

          {/* Progress bar container */}
          <div style={{ marginBottom: '25px' }}>
            <div 
              style={{ 
                height: '8px', 
                backgroundColor: '#e9ecef', 
                borderRadius: '4px', 
                position: 'relative',
                cursor: 'pointer',
                marginBottom: '40px',
                marginLeft: '10px',
                marginRight: '10px'
              }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percentage = (x / rect.width) * 100;
                const score = Math.round((percentage / 100) * 135);
                
                // Find the current maturity level based on score
                const currentLevel = surveyData.scoring.maturityLevels.find(
                  level => score >= level.range[0] && score <= level.range[1]
                );

                const tooltip = e.currentTarget.querySelector('.hover-tooltip');
                if (tooltip) {
                  tooltip.style.opacity = '1';
                  tooltip.style.visibility = 'visible';
                  tooltip.style.left = `${x}px`;
                  tooltip.textContent = currentLevel ? `${currentLevel.level}: ${score}` : '';
                }
              }}
              onMouseLeave={(e) => {
                const tooltip = e.currentTarget.querySelector('.hover-tooltip');
                if (tooltip) {
                  tooltip.style.opacity = '0';
                  tooltip.style.visibility = 'hidden';
                }
              }}
            >
              {/* Score progress */}
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, ((results.scoringSummary?.totalScore || 0) / 135) * 100)}%`,
                  backgroundColor: '#DC0032',
                  borderRadius: '4px'
                }}
              ></div>

              {/* Maturity Level Markers with Labels */}
              {[
                { label: "Absent", position: 0 },
                { label: "Limited", position: 20 },
                { label: "Emerging", position: 40 },
                { label: "Applied", position: 60 },
                { label: "Strategic", position: 80 },
                { label: "Innovative", position: 100 }
              ].map(({ label, position }, index) => (
                <div
                  key={label}
                  style={{
                    position: 'absolute',
                    left: `${position}%`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    transform: index === 5 ? 'translateX(-100%)' : 'translateX(-50%)',
                    width: index === 5 ? 'auto' : '2px'
                  }}
                >
                  <div
                    style={{
                      width: '2px',
                      height: '12px',
                      backgroundColor: '#2D2D2D',
                      opacity: 0.3,
                      marginBottom: '4px'
                    }}
                  />
                  <div style={{
                    fontSize: '12px',
                    color: '#666',
                    whiteSpace: 'nowrap',
                    textAlign: 'center',
                    position: 'absolute',
                    top: '16px'
                  }}>
                    {label}
                  </div>
                </div>
              ))}

              {/* Hover tooltip */}
              <div
                className="hover-tooltip"
                style={{
                  position: 'absolute',
                  top: '-30px',
                  transform: 'translateX(-50%)',
                  backgroundColor: '#2D2D2D',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '3px',
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                  opacity: 0,
                  visibility: 'hidden',
                  transition: 'opacity 0.2s',
                  zIndex: 1000
                }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* Category Scores */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#2D2D2D', marginBottom: '20px' }}>Category Scores</h2>
          {results.scoringSummary?.categoryScores && Object.entries(results.scoringSummary.categoryScores).map(([categoryId, score]) => {
            const categoryInfo = results.categoryDetails?.[categoryId] || {};
            return (
              <div key={categoryId} style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '5px', marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <h3 style={{ margin: 0, color: '#2D2D2D' }}>{categoryInfo.name || categoryId}</h3>
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
                <p style={{ color: '#2D2D2D' }}>{categoryInfo.description || 'No description available'}</p>
              </div>
            );
          })}
        </div>
        
        {/* Insights Section */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '5px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
          <h2 style={{ color: '#2D2D2D', marginBottom: '20px' }}>Insights For {results.companyName}</h2>
          
          {insightsLoading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p style={{ color: '#2D2D2D', marginTop: '10px' }}>Generating insights...</p>
            </div>
          ) : insightsError ? (
            <div style={{ 
              backgroundColor: '#FFF5F7', 
              color: '#DC0032', 
              padding: '15px', 
              borderRadius: '5px',
              marginBottom: '20px' 
            }}>
              <p>{insightsError}</p>
            </div>
          ) : insights ? (
            <>
              {/* Summary */}
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ color: '#2D2D2D', marginBottom: '15px', fontSize: '1.2em' }}>Summary</h3>
                <p style={{ color: '#2D2D2D', lineHeight: '1.6' }}>{insights.summary}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                {/* Key Findings */}
                <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '5px' }}>
                  <h3 style={{ color: '#2D2D2D', marginBottom: '15px', fontSize: '1.2em' }}>Key Findings</h3>
                  <ul style={{ paddingLeft: '20px', margin: 0 }}>
                    {insights.keyFindings?.map((finding, index) => (
                      <li key={index} style={{ color: '#2D2D2D', marginBottom: '10px' }}>{finding}</li>
                    ))}
                  </ul>
                </div>

                {/* Recommendations */}
                <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '5px' }}>
                  <h3 style={{ color: '#2D2D2D', marginBottom: '15px', fontSize: '1.2em' }}>Recommendations</h3>
                  <ul style={{ paddingLeft: '20px', margin: 0 }}>
                    {insights.recommendations?.map((rec, index) => (
                      <li key={index} style={{ color: '#2D2D2D', marginBottom: '10px' }}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Next Steps */}
              <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '5px' }}>
                <h3 style={{ color: '#2D2D2D', marginBottom: '15px', fontSize: '1.2em' }}>Work With Impact on these Next Steps</h3>
                <div style={{ display: 'grid', gap: '15px' }}>
                  {(insights.nextSteps || insights.actionItems)?.map((step, index) => (
                    <div 
                      key={index} 
                      style={{ 
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        backgroundColor: 'white',
                        padding: '15px',
                        borderRadius: '5px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                    >
                      <div style={{ 
                        minWidth: '24px',
                        height: '24px',
                        backgroundColor: '#DC0032',
                        color: 'white',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold'
                      }}>
                        {index + 1}
                      </div>
                      <p style={{ color: '#2D2D2D', margin: 0, flex: 1 }}>{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p style={{ color: '#2D2D2D', textAlign: 'center' }}>No insights available</p>
          )}
        </div>
      </div>
      
      {/* Action Buttons */}
      <div id="action-buttons" style={{ 
        marginTop: '30px',
        display: 'flex',
        gap: '15px',
        justifyContent: 'center'
      }}>
        <button
          onClick={handleDownloadPDF}
          disabled={generatingPdf}
          style={{
            padding: '12px 24px',
            backgroundColor: '#2D2D2D',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: generatingPdf ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '16px'
          }}
        >
          {generatingPdf ? 'Generating PDF...' : 'Download Results as PDF'}
        </button>
        
        <button
          onClick={handleShareViaEmail}
          style={{
            padding: '12px 24px',
            backgroundColor: '#DC0032',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Tell Others In Your Org
        </button>
      </div>
    </div>
  );
};

export default Results;
