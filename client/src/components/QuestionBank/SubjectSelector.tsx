import React from 'react';
import { cn } from '../../utils/cn';

interface Subject {
  name: string;
  label: string;
}

interface SubjectSelectorProps {
  subjects: Subject[];
  selectedSubject: string;
  onSubjectChange: (subject: string) => void;
}

const SubjectSelector: React.FC<SubjectSelectorProps> = ({
  subjects,
  selectedSubject,
  onSubjectChange
}) => {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3">选择学科</h3>
      <div className="flex flex-wrap gap-2">
        {subjects.map((subject) => (
          <button
            key={subject.name}
            onClick={() => onSubjectChange(subject.name)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-colors",
              "border border-gray-300 hover:border-gray-400",
              selectedSubject === subject.name
                ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                : "bg-white text-gray-700 hover:bg-gray-50"
            )}
          >
            {subject.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SubjectSelector;