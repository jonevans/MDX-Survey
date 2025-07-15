import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Sample survey data (we'll implement the API later)
const sampleSurveyData = {
  categories: [
    {
      id: "culture",
      name: "Culture",
      description: "How the organization embraces and prioritizes digital transformation",
      questions: [1, 2]
    },
    {
      id: "leadership",
      name: "Leadership",
      description: "How leadership views and supports digital initiatives",
      questions: [3, 4]
    }
  ],
  questions: [
    {
      id: 1,
      text: "Staff are open to change, eager to improve processes through technology, even if that change is difficult.",
      category: "culture"
    },
    {
      id: 2,
      text: "Digital Transformation is seen as key to success, and is prioritized at all levels of the organization.",
      category: "culture"
    },
    {
      id: 3,
      text: "Leadership sees Digital Transformation as integral to the overall strategy, and recognizes the need to manage technology as an ongoing investment.",
      category: "leadership"
    },
    {
      id: 4,
      text: "Senior management, outside of IT, is directly and actively involved in defining, designing and implementing digital initiatives and understands their impact on the business.",
      category: "leadership"
    }
  ],
  responseValues: {
    "Strongly Agree": 5,
    "Agree": 4,
    "Disagree": 2,
    "Strongly Disagree": 1,
    "No Opinion": 0
  }
};

const AssessmentForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [surveyData, setSurveyData] = useState(null);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  const [responseId, setResponseId] = useState(null);
  
  useEffect(() => {
    // In a real implementation, we'd fetch from the API
    // For now, use the sample data
    setSurveyData(sampleSurveyData);
    setLoading(false);
    
    // Start a new response or fetch existing incomplete response
    // For now, just set a dummy response ID
    setResponseId('dummyResponseId');
  }, []);
  
  const handleAnswerSelect = (questionId, score) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: score
    }));
  };
  
  const handleSave = async () => {
    setSaving(true);
    
    // In a real implementation, we'd save to the API
    console.log('Saving answers:', answers);
    
    // Simulating API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSaving(false);
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
    setSaving(true);
    
    // In a real implementation, we'd submit to the API
    console.log('Submitting assessment:', answers);
    
    // Simulating API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Navigate to results page
    navigate(`/results/${responseId}`);
  };
  
  if (loading) {
    return <div>Loading assessment...</div>;
  }
  
  if (!surveyData) {
    return <div>Error loading survey data.</div>;
  }
  
  const currentCategory = surveyData.categories[currentCategoryIndex];
  const currentQuestions = surveyData.questions.filter(
    q => currentCategory.questions.includes(q.id)
  );
  
  const isLastCategory = currentCategoryIndex === surveyData.categories.length - 1;
  const isCategoryComplete = currentQuestions.every(q => answers[q.id] !== undefined);
  
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Digital Transformation Assessment</h1>
      
      {/* Progress bar */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <span>Progress</span>
          <span>{currentCategoryIndex + 1} of {surveyData.categories.length}</span>
        </div>
        <div style={{ height: '8px', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
          <div
            style={{
              height: '100%',
              width: `${((currentCategoryIndex + 1) / surveyData.categories.length) * 100}%`,
              backgroundColor: '#007bff',
              borderRadius: '4px'
            }}
          ></div>
        </div>
      </div>
      
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '5px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h2>{currentCategory.name}</h2>
        <p style={{ marginBottom: '20px' }}>{currentCategory.description}</p>
        
        {currentQuestions.map(question => (
          <div key={question.id} style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
            <p style={{ marginBottom: '15px' }}>{question.text}</p>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {Object.entries(surveyData.responseValues).map(([label, value]) => (
                <button
                  key={value}
                  onClick={() => handleAnswerSelect(question.id, value)}
                  style={{
                    padding: '8px 12px',
                    border: answers[question.id] === value 
                      ? '2px solid #007bff' 
                      : '1px solid #ddd',
                    borderRadius: '3px',
                    backgroundColor: answers[question.id] === value 
                      ? '#e6f2ff' 
                      : 'white',
                    cursor: 'pointer'
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
          <button
            onClick={handlePrevious}
            disabled={currentCategoryIndex === 0}
            style={{
              padding: '10px 15px',
              backgroundColor: currentCategoryIndex === 0 ? '#e9ecef' : '#6c757d',
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
              onClick={handleSubmit}
              disabled={!isCategoryComplete || saving}
              style={{
                padding: '10px 15px',
                backgroundColor: isCategoryComplete && !saving ? '#28a745' : '#e9ecef',
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
              onClick={handleNext}
              disabled={!isCategoryComplete}
              style={{
                padding: '10px 15px',
                backgroundColor: isCategoryComplete ? '#007bff' : '#e9ecef',
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
