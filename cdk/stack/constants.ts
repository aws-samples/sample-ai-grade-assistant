export const defaultSettings = [
  {
    key: 'general',
    applicationName: 'AI Grade Assistant',
    lms: {
      name: 'moodle',
      value: 'Moodle',
    },
    notificationEmail: '',
  },
  {
    key: 'prompt',
    bedrockRegion: 'ap-southeast-2',
    gradingPrompt:
      "<qn>\n{{qn}}\n</qn>\n\n<criteria>\n{{criteria_desc}}\n</criteria>\n\n<band_scores>\n{{band_scores}}\n</band_scores>\n\nInstructions:\n\n1. The students' submission must cover a 5-year window for the financial report of the companies.\n\n2. Evaluate the submission texts and images in <ans></ans> against the task definition given in <qn></qn> and criteria given in <criteria></criteria>. Make sure the information is correct and relevant to the task. Focus on the areas of improvement for your evaluation and insist on the highest standards. Be harsh but fair in your evaluation. Then, write feedback and include citations from the assignment submission to justify your feedback. Output your feedback within <long_feedback></long_feedback> tags. Then write a short feedback under 100 words and output it in <short_feedback></short_feedback> tags.\n\n3. Based on your short feedback, the student submission and the grading scale given in <grading_scale_criteria></grading_scale_criteria>, assign a grade band for the student's submission. Output the grade band within <band></band> tags.\n\n4. Assign score for the assignment submission based on the score range for each grade band given in <band_scores></band_scores>. Output the score within <score></score> tags.",
    modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
    systemPrompt:
      'You are a senior assessor for a very renowned University in Australia. Your job is to review university students submissions and grade them. You have really high standards and you except high quality submissions from your students.',
  },
];
