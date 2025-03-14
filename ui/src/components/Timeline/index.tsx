import './timeline.scss';

interface TimelineProps {
  steps?: { name: string }[];
  activeStep?: string;
}

const defaultSteps = [
  { name: 'Initialising' },
  { name: 'Processing PDF document' },
  { name: 'Analysing document' },
  { name: 'Grading rubrics' },
  { name: 'Generating overall feedback' },
];

const ProgressBar = ({ steps = defaultSteps, activeStep }: TimelineProps) => {
  const currentStep = activeStep ?? steps[0].name;
  const index = steps.findIndex((x) => currentStep.startsWith(x.name));
  const activeStepIndex = index > -1 ? index : 0;

  const description =
    activeStep !== steps[activeStepIndex].name
      ? activeStep?.split('##')[1]?.trim() || activeStep
      : undefined;
  const activeStepDescription = index > -1 ? description : undefined;

  return (
    <div className="progressbar-container">
      <div className="progressbar-wrapper">
        <ul className="progressbar">
          {steps.map((step, i) => {
            let className = '';
            if (i < activeStepIndex) className = 'complete';
            if (i === activeStepIndex) className = 'active';

            return (
              <li key={step.name} className={className} role="none">
                <div className="progressbar-spinner" />
                <span className="progressbar-label">{step.name}</span>

                {activeStepDescription && i === activeStepIndex && (
                  <span className="progressbar-sublabel">{activeStepDescription}</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default ProgressBar;
