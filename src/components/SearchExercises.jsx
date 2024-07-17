import { React, useState, useEffect } from "react";
import HorizontalScrollBar from "./HorizontalScrollBar";
import axios from "axios";
import ReactPaginate from "react-paginate";
import ExerciseCard from "./ExerciseCard.jsx";

export default function SearchExercise() {
  const [search, setSearch] = useState("");
  const [mouseOver, setMouseOver] = useState(false);
  const [exercise, setExercise] = useState([]);
  const [bodyPart, setBodyPart] = useState([]);
  const [selectedBodyPart, setSelectedBodyPart] = useState("all");
  const baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000';

  useEffect(() => {
    const ExerciseData = async () => {
      try {
        const response = await axios.get(`${baseURL}/exerciseBodyPart`);
        const data = response.data;
        console.log(data);
        setBodyPart(["all", ...data]);
      } catch (err) {
        console.log(err);
      }
    };
    ExerciseData();
  }, []);

  function isMouseOver() {
    setMouseOver(true);
  }

  function isMouseOut() {
    setMouseOver(false);
  }

  const [currentPage, setCurrentPage] = useState(0);
  const cardsPerPage = 9;

  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected);
  };

  async function handleSearch() {
    if (typeof search === "string" && search !== "") {
      try {
        const response = await axios.get(
          `/exerciseBodyPartName?bodyPart=${search}`
        );
        const exerciseData = response.data;
        const searchedExercise = exerciseData.filter(
          (exercise) =>
            exercise.name.toLowerCase().includes(search.toLowerCase()) ||
            exercise.target.toLowerCase().includes(search.toLowerCase()) ||
            exercise.equipment.toLowerCase().includes(search.toLowerCase()) ||
            exercise.bodyPart.toLowerCase().includes(search.toLowerCase())
        );
        setSearch("");
        setExercise(searchedExercise);
        setSelectedBodyPart("all");
      } catch (err) {
        console.log(err);
      }
    } else {
      console.log("Exercise not found. Please try again.");
    }
  }

  async function handleBodyPartClick(selected) {
    setSelectedBodyPart(selected);
    setSearch("");
    setCurrentPage(0);

    if (selected === "all") {
      // Fetch all exercises
      try {
        const response = await axios.get("/exerciseBodyPart");
        const data = response.data;
        setExercise(data);
      } catch (err) {
        console.log(err);
      }
    } else {
      // Fetch exercises by body part
      try {
        const response = await axios.get(
          `/exerciseByBodyPart?bodyPart=${selected}`
        );
        const data = response.data;
        setExercise(data);
      } catch (err) {
        console.log(err);
      }
    }
  }

  const filteredExercise = search !== "" || selectedBodyPart !== "all" ? exercise : [];

  const pageCount = Math.ceil(filteredExercise.length / cardsPerPage);
  const offset = currentPage * cardsPerPage;
  const currentCards = filteredExercise.slice(offset, offset + cardsPerPage);

  return (
    <div className="pt-12 pb-5">
      <h1 className="flex justify-center items-center text-3xl pt-3 text-black font-semibold">
        Awesome Exercises You Should Know
      </h1>
      <div className="pt-10 flex justify-center items-center gap-1">
        <input
          className="w-6/12 h-10 border border-0 rounded-lg outlin-inherient"
          placeholder="Please Search Exercises"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          className="w-20 h-10 bg-primary text-white"
          style={{ backgroundColor: mouseOver ? "#000" : "#ef4444" }}
          onClick={handleSearch}
          onMouseOver={isMouseOver}
          onMouseOut={isMouseOut}
        >
          Search
        </button>
      </div>

      <div className="pt-10 relative w-full pl-5">
        <HorizontalScrollBar
          data={bodyPart}
          onClick={handleBodyPartClick}
          selected={selectedBodyPart}
        />
      </div>
      <div className="grid sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-5 text-primary">
        {currentCards.map((value) => (
          <ExerciseCard key={value.id} exercise={value} />
        ))}
      </div>
      <ReactPaginate
        previousLabel={""}
        nextLabel={""}
        breakLabel={"..."}
        pageCount={pageCount}
        marginPagesDisplayed={2}
        pageRangeDisplayed={5}
        onPageChange={handlePageChange}
        containerClassName={"pagination"}
        activeClassName={"active"}
      />
    </div>
  );
}