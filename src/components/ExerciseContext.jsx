import React, { useState, useEffect, createContext } from "react";
import axios from "axios";

export const ExerciseContext = createContext();

export function ExerciseProvider({ children }) {
  const [exerciseData, setExerciseData] = useState([]);
  const [selectedBodyPart, setSelectedBodyPart] = useState(null);
  const [selectedExerciseData, setSelectedExerciseData] = useState([]);
  const baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000';

  useEffect(() => {
    const fetchExerciseData = async () => {
      try {
        const response = await axios.get(`${baseURL}/exerciseData`);
        const data = response.data;
        setExerciseData(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchExerciseData();
  }, []);

  useEffect(() => {
    const fetchSelectedExerciseData = async () => {
      if (selectedBodyPart) {
        try {
          let response;
          if (selectedBodyPart === "all") {
            response = await axios.get(`${baseURL}/exerciseData`);
          } else {
            response = await axios.get(
              `/exerciseBodyPartName?bodyPart=${selectedBodyPart}`
            );
          }
          const data = response.data;
          setSelectedExerciseData(data);
        } catch (error) {
          console.error(error);
        }
      } else {
        setSelectedExerciseData([]);
      }
    };
  
    fetchSelectedExerciseData();
  }, [selectedBodyPart]);

  return (
    <ExerciseContext.Provider
      value={{
        exerciseData,
        selectedBodyPart,
        setSelectedBodyPart,
        selectedExerciseData,
      }}
    >
      {children}
    </ExerciseContext.Provider>
  );
}