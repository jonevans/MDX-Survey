import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Logo from './Logo';
import API_URL from '../config/api';

const AssessmentForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [surveyData, setSurveyData] = useState(null);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  const [responseId, setResponseId] = useState(null);
  const [error, setError] = useState(null);
  const [categoryFeedback, setCategoryFeedback] = useState({});
  const [saveTimeout, setSaveTimeout] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Add style tag for focus outline
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .survey-button:focus {
        outline: none !important;
        box-shadow: 0 0 0 2px #2D2D2D !important;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  
  // Add effect to handle scrolling when category changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentCategoryIndex]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);
  
  useEffect(() => {
    const fetchSurveyData = async () => {
      try {
        setLoading(true);
        
        // Fetch survey structure
        const surveyResponse = await axios.get(`${API_URL}/api/survey`);
        
        // Start a new response or fetch existing incomplete response
        const responseResponse = await axios.post(`${API_URL}/api/responses/start`);
        
        setSurveyData(surveyResponse.data);
        setResponseId(responseResponse.data.response._id);
        setIsEditing(responseResponse.data.isEditing || false);
        
        // Pre-populate answers if there are any
        if (responseResponse.data.response.answers && responseResponse.data.response.answers.length > 0) {
          const savedAnswers = {};
          responseResponse.data.response.answers.forEach(answer => {
            savedAnswers[answer.questionId] = answer.score;
          });
          setAnswers(savedAnswers);
        }
        
        // Pre-populate category feedback if it exists
        if (responseResponse.data.response.categoryFeedback) {
          setCategoryFeedback(responseResponse.data.response.categoryFeedback);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load survey data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchSurveyData();
  }, []);
  
  const handleAnswerSelect = (questionId, score) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: score
    }));
  };
  
  const handleFeedbackChange = (category, field, value) => {
    setCategoryFeedback(prev => ({
      ...prev,
      [category]: {
        ...(prev[category] || {}),
        [field]: value
      }
    }));

    // Clear any existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Set a new timeout to save after 1 second of no typing
    const timeoutId = setTimeout(() => {
      handleSave();
    }, 1000);

    setSaveTimeout(timeoutId);
  };
  
  const handleSave = async () => {
    if (!responseId) return;
    
    setSaving(true);
    
    try {
      await axios.put(`${API_URL}/api/responses/${responseId}/save`, {
        answers,
        categoryFeedback: {
          [surveyData.categories[currentCategoryIndex].id]: categoryFeedback[surveyData.categories[currentCategoryIndex].id]
        },
        sectionProgress: {
          [surveyData.categories[currentCategoryIndex].id]: true
        }
      });
      
    } catch (err) {
      console.error('Error saving progress:', err);
      setError('Failed to save progress. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  const handlePrevious = () => {
    if (currentCategoryIndex > 0) {
      handleSave();
      setCurrentCategoryIndex(prev => prev - 1);
    }
  };
  
  const handleNext = () => {
    if (surveyData && currentCategoryIndex < surveyData.categories.length - 1) {
      handleSave();
      setCurrentCategoryIndex(prev => prev + 1);
    }
  };
  
  const handleSubmit = async () => {
    if (!responseId) return;
    
    setSaving(true);
    
    // Format answers to match the expected schema
    const formattedAnswers = Object.entries(answers).map(([questionId, score]) => {
      // Find question category
      const question = surveyData.questions.find(q => q.id === parseInt(questionId));
      const category = question ? question.category : 'unknown';
      
      return {
        questionId: parseInt(questionId),
        category,
        score: parseInt(score)
      };
    });
    
    const submitData = {
      answers: formattedAnswers,
      categoryFeedback
    };
    
    
    try {
      const res = await axios.put(`${API_URL}/api/responses/${responseId}/complete`, submitData);
      
      
      // Navigate to results page
      navigate(`/results/${responseId}`);
    } catch (err) {
      
      let errorMessage = 'Failed to submit assessment';
      if (err.response?.data?.message) {
        errorMessage += `: ${err.response.data.message}`;
      } else if (err.message) {
        errorMessage += `: ${err.message}`;
      }
      
      setError(errorMessage);
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '80vh' 
      }}>
        <div style={{ 
          width: '120px', 
          height: '120px', 
          animation: 'spin 1.5s linear infinite' 
        }}>
          <Logo />
        </div>
        <div style={{ marginTop: '20px', color: '#2D2D2D', fontSize: '18px' }}>
          Loading assessment...
        </div>
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
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 15px',
            backgroundColor: '#DC0032',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }
  
  if (!surveyData || !surveyData.categories || surveyData.categories.length === 0) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', textAlign: 'center' }}>
        <div>Error loading survey data.</div>
      </div>
    );
  }
  
  const currentCategory = surveyData.categories[currentCategoryIndex];
  const currentQuestions = surveyData.questions.filter(
    q => currentCategory.questions.includes(q.id)
  );
  
  
  const isLastCategory = currentCategoryIndex === surveyData.categories.length - 1;
  const isCategoryComplete = currentQuestions.every(q => answers[q.id] !== undefined);
  
  return (
    <div className="form-wrapper" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', position: 'relative' }}>
      {/* Submission Overlay */}
      {saving && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ 
            width: '120px', 
            height: '120px', 
            animation: 'spin 1.5s linear infinite',
            marginBottom: '20px'
          }}>
            <Logo />
          </div>
          <div style={{ color: '#2D2D2D', fontSize: '18px', fontWeight: '500' }}>
            Submitting your assessment...
          </div>
          <div style={{ color: '#666', fontSize: '14px', marginTop: '10px', textAlign: 'center', maxWidth: '400px' }}>
            Please wait while we process your responses and generate your digital transformation insights.
          </div>
        </div>
      )}
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex' }}>
          <Logo />
        </div>
        <h1 style={{ color: '#2D2D2D' }}>
          {isEditing ? 'Edit Your Assessment' : 'Digital Transformation Assessment'}
        </h1>
      </div>
      
      {/* Editing notification */}
      {isEditing && (
        <div style={{ 
          backgroundColor: '#fff3cd', 
          color: '#856404', 
          padding: '10px 15px', 
          borderRadius: '5px',
          marginBottom: '20px',
          border: '1px solid #ffeaa7'
        }}>
          📝 You are editing your existing assessment. Any changes will update your results and generate new insights.
        </div>
      )}
      
      {/* Progress bar */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <span style={{ color: '#2D2D2D' }}>Progress</span>
          <span style={{ color: '#2D2D2D' }}>{currentCategoryIndex + 1} of {surveyData.categories.length}</span>
        </div>
        <div style={{ height: '8px', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
          <div
            style={{
              height: '100%',
              width: `${((currentCategoryIndex + 1) / surveyData.categories.length) * 100}%`,
              backgroundColor: '#DC0032',
              borderRadius: '4px'
            }}
          ></div>
        </div>
      </div>
      
      <div className="form-container" style={{ backgroundColor: 'white', padding: '20px', borderRadius: '5px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#2D2D2D' }}>{currentCategory.name}</h2>
        <p style={{ marginBottom: '20px', color: '#2D2D2D' }}>{currentCategory.description}</p>
        
        {currentQuestions.map(question => (
          <div key={question.id} className="form-element" style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
            <p style={{ marginBottom: '15px', color: '#2D2D2D' }}>{question.text}</p>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {Object.entries(surveyData.responseValues).map(([label, value]) => (
                <button
                  className="survey-button"
                  key={value}
                  onClick={() => handleAnswerSelect(question.id, value)}
                  style={{
                    padding: '8px 12px',
                    border: answers[question.id] === value 
                      ? '2px solid #DC0032' 
                      : '1px solid #ddd',
                    borderRadius: '3px',
                    backgroundColor: answers[question.id] === value 
                      ? '#FFF5F7' 
                      : 'white',
                    color: '#2D2D2D',
                    cursor: 'pointer'
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
        
        {/* Qualitative Feedback Section */}
        <div style={{ 
          marginTop: '30px', 
          padding: '20px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '5px',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ color: '#2D2D2D', marginBottom: '15px' }}>Additional Context</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#2D2D2D', fontWeight: '500' }}>
              What's Working Well?
            </label>
            <textarea
              value={categoryFeedback[currentCategory.id]?.strengths || ''}
              onChange={(e) => handleFeedbackChange(currentCategory.id, 'strengths', e.target.value)}
              placeholder="Share specific examples of successful digital initiatives or positive aspects in this area"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '3px',
                border: '1px solid #ddd',
                minHeight: '100px',
                color: '#2D2D2D'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#2D2D2D', fontWeight: '500' }}>
              What could be improved?
            </label>
            <textarea
              value={categoryFeedback[currentCategory.id]?.challenges || ''}
              onChange={(e) => handleFeedbackChange(currentCategory.id, 'challenges', e.target.value)}
              placeholder="What aspects of digital transformation in this area need improvement?"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '3px',
                border: '1px solid #ddd',
                minHeight: '100px',
                color: '#2D2D2D'
              }}
            />
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
          <button
            className="survey-button"
            onClick={handlePrevious}
            disabled={currentCategoryIndex === 0}
            style={{
              padding: '10px 15px',
              backgroundColor: currentCategoryIndex === 0 ? '#e9ecef' : '#2D2D2D',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: currentCategoryIndex === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            Previous
          </button>
          
          {isLastCategory ? (
            <button
              className="survey-button"
              onClick={handleSubmit}
              disabled={!isCategoryComplete || saving}
              style={{
                padding: '10px 15px',
                backgroundColor: isCategoryComplete && !saving ? '#DC0032' : '#e9ecef',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: isCategoryComplete && !saving ? 'pointer' : 'not-allowed'
              }}
            >
              {saving ? 'Submitting...' : 'Submit Assessment'}
            </button>
          ) : (
            <button
              className="survey-button"
              onClick={handleNext}
              disabled={!isCategoryComplete}
              style={{
                padding: '10px 15px',
                backgroundColor: isCategoryComplete ? '#DC0032' : '#e9ecef',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: isCategoryComplete ? 'pointer' : 'not-allowed'
              }}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssessmentForm;
