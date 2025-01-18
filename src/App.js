import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';  // import quill styles
import './App.css';

function App() {
  const [layoutHtml, setLayoutHtml] = useState('');
  const [emailConfig, setEmailConfig] = useState({ title: '', content: '', imageUrl: '' });
  const [editorHtml, setEditorHtml] = useState(''); // content for ReactQuill
  const proxy = 'https://email-builder-backend.onrender.com'; // const proxy ='http://localhost:5000';


  // Fetch the layout from the backend
  useEffect(() => {
    axios.get(`${proxy}/getEmailLayout`)
      .then((response) => {
        setLayoutHtml(response.data);
      })
      .catch((error) => {
        console.error('Error fetching layout:', error);
      });
  }, []);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setEmailConfig((prev) => ({ ...prev, [field]: value }));
  };

  // Handle image upload
  const handleImageUpload = (file) => {
    const formData = new FormData();
    formData.append('image', file);

    axios.post(`${proxy}/uploadImage`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((response) => {
      const imageUrl = `${proxy}${response.data.imageUrl}`;
      setEmailConfig((prev) => ({ ...prev, imageUrl }));
      // Insert the image into the Quill editor
      const quill = document.querySelector('.ql-editor');
      const range = quill.getSelection();
      quill.insertEmbed(range.index, 'image', imageUrl);
    }).catch((error) => {
      console.error('Error uploading image:', error);
    });
  };

  // Handle image insert via file input
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  // Submit the email config to the backend
  const handleSubmit = () => {
    axios.post(`${proxy}/uploadEmailConfig`, emailConfig)
      .then(() => {
        alert('Configuration saved successfully!');
      })
      .catch((error) => {
        console.error('Error saving configuration:', error);
      });
  };

  // Render preview with dynamic replacements
  const renderPreview = () => {
    let previewHtml = layoutHtml;
    previewHtml = previewHtml.replace('{{title}}', emailConfig.title || '');
    previewHtml = previewHtml.replace('{{content}}', emailConfig.content || '');
    previewHtml = previewHtml.replace('{{imageUrl}}', emailConfig.imageUrl || '');

    return { __html: previewHtml };
  };

  // Function to download rendered HTML as file
  const downloadHTML = () => {
    const renderedHtml = renderPreview().__html;
    const blob = new Blob([renderedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'renderedOutput.html';
    link.click();
    URL.revokeObjectURL(url); // Clean up after download
  };

  return (
    <div className="App">
      <header className="header">
        <h1>Email Builder</h1>
      </header>
      <div className="container">
        <div className="editor-panel">
          {/* Editable Title */}
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              placeholder="Enter Title"
              value={emailConfig.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
            />
          </div>

          {/* Editable Content */}
          <div className="form-group">
            <label htmlFor="content">Content</label>
            <ReactQuill
              value={editorHtml}
              onChange={(value) => {
                setEditorHtml(value);
                handleInputChange('content', value); // Update emailConfig content
              }}
              modules={{
                toolbar: [
                  [{ 'header': '1'}, {'header': '2'}, { 'font': [] }],
                  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ 'align': [] }],
                  ['link', 'image'], // Enable image button
                  [{ 'color': [] }, { 'background': [] }],
                  ['clean'],
                ],
              }}
              placeholder="Enter Content"
            />
          </div>

          {/* Image Upload Button */}
          <div className="form-group">
            <input id="image" type="file" onChange={handleFileChange} />
          </div>

          {/* Save Configuration Button */}
          <button className="btn-save" onClick={handleSubmit}>Save Configuration</button>
        </div>

        {/* Preview Section */}
        <div className="preview-panel">
          <h2>Preview</h2>
          <div className="preview" dangerouslySetInnerHTML={renderPreview()} />
           {/* Download Button */}
        <div className="download-section">
          <button className="btn-download" onClick={downloadHTML}>Download HTML</button>
        </div>
        </div>

       
      </div>
    </div>
  );
}

export default App;
