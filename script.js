let currentSlide = 0;

function showSlide(index) {
  const slides = document.getElementsByClassName("slide");
  if (index >= slides.length) {
    currentSlide = slides.length - 1;
  } else if (index < 0) {
    currentSlide = 0;
  } else {
    currentSlide = index;
  }

  for (let i = 0; i < slides.length; i++) {
    slides[i].classList.remove("active-slide");
  }
  slides[currentSlide].classList.add("active-slide");
}

function navigate(direction) {
  showSlide(currentSlide + direction);
}

showSlide(currentSlide);

function createScene1() {
  Promise.all([
    d3.csv("./data/constructor_results.csv"),
    d3.csv("./data/races.csv"),
    d3.csv("./data/constructors.csv"),
    d3.csv("./data/results.csv"),
  ])
    .then(
      ([constructorResultsData, racesData, constructorsData, resultsData]) => {
        constructorResultsData.forEach((d) => {
          d.raceId = +d.raceId;
          d.constructorId = +d.constructorId;
          d.points = +d.points;
        });

        racesData.forEach((d) => {
          d.raceId = +d.raceId;
          d.year = +d.year;
        });
        const filteredRacesData = racesData.filter(
          (d) => d.year >= 2005 && d.year <= 2021
        );

        const redBull = constructorsData.find((d) => d.name === "Red Bull");
        const redBullConstructorId = redBull.constructorId;

        const redBullResults = constructorResultsData.filter(
          (d) => d.constructorId === 9
        );

        const performanceData = redBullResults
          .map((result) => {
            const race = filteredRacesData.find(
              (r) => r.raceId === result.raceId
            );
            if (race) {
              return {
                year: race.year,
                points: result.points,
              };
            }
          })
          .filter((d) => d !== undefined);

        const pointsByYear = d3.rollup(
          performanceData,
          (v) => d3.sum(v, (d) => d.points),
          (d) => d.year
        );
        const pointsData = Array.from(pointsByYear, ([year, points]) => ({
          year,
          points,
        })).sort((a, b) => a.year - b.year);

        resultsData.forEach((d) => {
          d.raceId = +d.raceId;
          d.constructorId = +d.constructorId;
          d.position = +d.position;
        });

        const redBullPositionResults = resultsData.filter(
          (d) => d.constructorId === 9
        );
        const positionData = redBullPositionResults
          .map((result) => {
            const race = filteredRacesData.find(
              (r) => r.raceId === result.raceId
            );
            if (race) {
              return {
                year: race.year,
                position: result.position,
              };
            }
          })
          .filter((d) => d !== undefined);

        const positionsByYear = d3.rollup(
          positionData,
          (v) => d3.mean(v, (d) => d.position),
          (d) => d.year
        );
        const positionsData = Array.from(
          positionsByYear,
          ([year, position]) => ({ year, position })
        );

        const margin = { top: 100, right: 30, bottom: 80, left: 50 };
        const width = 800 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        const svgPoints = d3
          .select("#points-chart")
          .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          .append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);

        const xPoints = d3
          .scaleBand()
          .domain(pointsData.map((d) => d.year))
          .range([0, width])
          .padding(0.1);

        const yPoints = d3
          .scaleLinear()
          .domain([0, d3.max(pointsData, (d) => d.points)])
          .nice()
          .range([height, 0]);

        svgPoints
          .append("g")
          .attr("transform", `translate(0,${height})`)
          .call(d3.axisBottom(xPoints).tickFormat(d3.format("d")))
          .append("text")
          .attr("class", "axis-title")
          .attr("x", width / 2)
          .attr("y", margin.bottom - 10)
          .attr("fill", "black")
          .style("text-anchor", "middle")
          .text("Year");

        svgPoints
          .append("g")
          .call(d3.axisLeft(yPoints))
          .append("text")
          .attr("class", "axis-title")
          .attr("transform", "rotate(-90)")
          .attr("x", -height / 2)
          .attr("y", -margin.left + 20)
          .attr("fill", "black")
          .style("text-anchor", "middle")
          .text("Points");

        const tooltipPoints = d3
          .select("body")
          .append("div")
          .attr("class", "tooltip")
          .style("opacity", 0);

        svgPoints
          .selectAll(".bar")
          .data(pointsData)
          .enter()
          .append("rect")
          .attr("class", "bar")
          .attr("x", (d) => xPoints(d.year))
          .attr("y", (d) => yPoints(d.points))
          .attr("width", xPoints.bandwidth())
          .attr("height", (d) => height - yPoints(d.points))
          .attr("fill", "steelblue")
          .on("mouseover", function (event, d) {
            tooltipPoints.transition().duration(200).style("opacity", 0.9);
            tooltipPoints
              .html(`Year: ${d.year}<br>Points: ${d.points}`)
              .style("left", event.pageX + 5 + "px")
              .style("top", event.pageY - 28 + "px");
          })
          .on("mouseout", function () {
            tooltipPoints.transition().duration(500).style("opacity", 0);
          });

        svgPoints
          .append("text")
          .attr("x", width / 2)
          .attr("y", -60)
          .attr("text-anchor", "middle")
          .attr("class", "chart-title")
          .text("Red Bull Points per Year");

        const svgPositions = d3
          .select("#positions-chart")
          .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          .append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);

        const xPositions = d3
          .scaleBand()
          .domain(positionsData.map((d) => d.year))
          .range([0, width])
          .padding(0.1);

        const yPositions = d3
          .scaleLinear()
          .domain([d3.max(positionsData, (d) => d.position), 1])
          .nice()
          .range([height, 0]);

        svgPositions
          .append("g")
          .attr("transform", `translate(0,${height})`)
          .call(d3.axisBottom(xPositions).tickFormat(d3.format("d")))
          .append("text")
          .attr("class", "axis-title")
          .attr("x", width / 2)
          .attr("y", margin.bottom - 10)
          .attr("fill", "black")
          .style("text-anchor", "middle")
          .text("Year");

        svgPositions
          .append("g")
          .call(d3.axisLeft(yPositions))
          .append("text")
          .attr("class", "axis-title")
          .attr("transform", "rotate(-90)")
          .attr("x", -height / 2)
          .attr("y", -margin.left + 20)
          .attr("fill", "black")
          .style("text-anchor", "middle")
          .text("Average Position");

        svgPositions
          .append("path")
          .datum(positionsData)
          .attr("fill", "none")
          .attr("stroke", "red")
          .attr("stroke-width", 1.5)
          .attr(
            "d",
            d3
              .line()
              .x((d) => xPositions(d.year) + xPositions.bandwidth() / 2)
              .y((d) => yPositions(d.position))
          );

        const tooltipPositions = d3
          .select("body")
          .append("div")
          .attr("class", "tooltip")
          .style("opacity", 0);

        svgPositions
          .selectAll(".dot")
          .data(positionsData)
          .enter()
          .append("circle")
          .attr("class", "dot")
          .attr("cx", (d) => xPositions(d.year) + xPositions.bandwidth() / 2)
          .attr("cy", (d) => yPositions(d.position))
          .attr("r", 3)
          .attr("fill", "red")
          .on("mouseover", function (event, d) {
            tooltipPositions.transition().duration(200).style("opacity", 0.9);
            tooltipPositions
              .html(`Year: ${d.year}<br>Position: ${d.position.toFixed(2)}`)
              .style("left", event.pageX + 5 + "px")
              .style("top", event.pageY - 28 + "px");
          })
          .on("mouseout", function () {
            tooltipPositions.transition().duration(500).style("opacity", 0);
          });

        svgPositions
          .append("text")
          .attr("x", width / 2)
          .attr("y", -40)
          .attr("text-anchor", "middle")
          .attr("class", "chart-title")
          .text("Red Bull Average Position per Year");

        const pointsAnnotations = d3
          .annotation()
          .type(d3.annotationLabel)
          .annotations([
            {
              note: {
                label: "Red Bull Enters F1 by Acquiring Jaguar",
                title: "2005",
              },
              x: xPoints(2005) + xPoints.bandwidth() / 2,
              y: yPoints(pointsData.find((d) => d.year === 2005).points),
              dy: -20,
              dx: 40,
            },
            {
              note: { label: "First Win: Chinese GP", title: "2009" },
              x: xPoints(2009) + xPoints.bandwidth() / 2,
              y: yPoints(pointsData.find((d) => d.year === 2009).points),
              dy: -20,
              dx: -40,
            },
            {
              note: {
                label: "First Constructors’ Championship",
                title: "2010",
              },
              x: xPoints(2010) + xPoints.bandwidth() / 2,
              y: yPoints(pointsData.find((d) => d.year === 2010).points),
              dy: -10,
              dx: -40,
            },
            {
              note: { label: "Vettel's 2nd Championship", title: "2011" },
              x: xPoints(2011) + xPoints.bandwidth() / 2,
              y: yPoints(pointsData.find((d) => d.year === 2011).points),
              dy: -10,
              dx: -40,
            },
            {
              note: { label: "4th Consecutive Championship", title: "2013" },
              x: xPoints(2013) + xPoints.bandwidth() / 2,
              y: yPoints(pointsData.find((d) => d.year === 2013).points),
              dy: -10,
              dx: 30,
            },
            {
              note: { label: "Verstappen's 1st Championship", title: "2021" },
              x: xPoints(2021) + xPoints.bandwidth() / 2,
              y: yPoints(pointsData.find((d) => d.year === 2021).points),
              dy: -10,
              dx: 0,
            },
          ]);

        svgPoints
          .append("g")
          .attr("class", "annotation-group")
          .call(pointsAnnotations);

        const positionsAnnotations = d3
          .annotation()
          .type(d3.annotationLabel)
          .annotations([
            {
              note: {
                label: "Introduction of RB5 and First Win",
                title: "2009",
              },
              x: xPositions(2009) + xPositions.bandwidth() / 2,
              y: yPositions(
                positionsData.find((d) => d.year === 2009).position
              ),
              dy: -10,
              dx: -30,
            },
            {
              note: {
                label: "Uncompetitive Renault Power Unit",
                title: "2014",
              },
              x: xPositions(2014) + xPositions.bandwidth() / 2,
              y: yPositions(
                positionsData.find((d) => d.year === 2014).position
              ),
              dy: 20,
              dx: -25,
            },
            {
              note: {
                label: "Improved Renault (TAG Heuer) Power Unit",
                title: "2016",
              },
              x: xPositions(2016) + xPositions.bandwidth() / 2,
              y: yPositions(
                positionsData.find((d) => d.year === 2016).position
              ),
              dy: -15,
              dx: -10,
            },
            {
              note: {
                label: "Smooth Transition to Honda Power",
                title: "2019",
              },
              x: xPositions(2019) + xPositions.bandwidth() / 2,
              y: yPositions(
                positionsData.find((d) => d.year === 2019).position
              ),
              dy: -40,
              dx: 0,
            },
          ]);

        svgPositions
          .append("g")
          .attr("class", "annotation-group")
          .call(positionsAnnotations);
      }
    )
    .catch((error) => {
      console.error("Error loading or processing data:", error);
    });
}

function createScene2() {
  Promise.all([
    d3.csv("./data/races.csv"),
    d3.csv("./data/lap_times.csv"),
    d3.csv("./data/pit_stops.csv"),
    d3.csv("./data/constructor_results.csv"),
  ])
    .then(([racesData, lapTimesData, pitStopsData, constructorResultsData]) => {
      racesData.forEach((d) => {
        d.year = +d.year;
        d.raceId = +d.raceId;
      });

      const filteredRacesData = racesData.filter(
        (d) => d.year >= 2005 && d.year <= 2021
      );

      constructorResultsData.forEach((d) => {
        d.raceId = +d.raceId;
        d.constructorId = +d.constructorId;
        d.points = +d.points;
      });

      const redBullResults = constructorResultsData.filter(
        (d) => d.constructorId === 9
      );

      const significantRaces = filteredRacesData
        .filter((race) => {
          const raceResults = redBullResults.filter(
            (result) => result.raceId === race.raceId
          );
          return raceResults.reduce((acc, curr) => acc + curr.points, 0) > 0;
        })
        .map((race) => {
          const raceResults = redBullResults.filter(
            (result) => result.raceId === race.raceId
          );
          return {
            ...race,
            points: raceResults.reduce((acc, curr) => acc + curr.points, 0),
          };
        });

      lapTimesData.forEach((d) => {
        d.raceId = +d.raceId;
        d.milliseconds = +d.milliseconds;
      });

      pitStopsData.forEach((d) => {
        d.raceId = +d.raceId;
        d.milliseconds = +d.milliseconds;
      });

      const margin = { top: 50, right: 30, bottom: 100, left: 50 };
      const width = 800 - margin.left - margin.right;
      const height = 500 - margin.top - margin.bottom;

      const svgSignificantRaces = d3
        .select("#significant-races-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      const xScale = d3.scaleLinear().domain([2005, 2021]).range([0, width]);

      const yScale = d3
        .scaleLinear()
        .domain([0, d3.max(significantRaces, (d) => d.points)])
        .nice()
        .range([height, 0]);

      svgSignificantRaces
        .append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));

      svgSignificantRaces
        .append("g")
        .call(d3.axisLeft(yScale))
        .append("text")
        .attr("class", "axis-title")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 20)
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .text("Points");

      const tooltip = d3
        .select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

      const annotations = [
        {
          year: 2009,
          name: "Chinese Grand Prix",
          label: "2009 Chinese GP: Red Bull's first F1 win",
        },
        {
          year: 2010,
          name: "Monaco Grand Prix",
          label: "2010 Monaco GP: Mark Webber's dominant performance",
        },
        {
          year: 2010,
          name: "Brazilian Grand Prix",
          label:
            "2010 Brazilian GP: Vettel wins, setting up championship decider",
        },
        {
          year: 2010,
          name: "Abu Dhabi Grand Prix",
          label:
            "2010 Abu Dhabi GP: Vettel becomes the team's first world champion",
        },
        {
          year: 2011,
          name: "Malaysian Grand Prix",
          label: "2011 Malaysian GP: Vettel's strategic win",
        },
        {
          year: 2012,
          name: "Abu Dhabi Grand Prix",
          label: "2012 Abu Dhabi GP: Vettel wins from the pit lane",
        },
        {
          year: 2013,
          name: "Indian Grand Prix",
          label:
            "2013 Indian GP: Vettel's fourth title sparked an iconic celebration",
        },
        {
          year: 2013,
          name: "United States Grand Prix",
          label: "2013 US GP: Vettel's eighth consecutive win",
        },
        {
          year: 2014,
          name: "Canadian Grand Prix",
          label: "2014 Canadian GP: Ricciardo's breakthrough win",
        },
        {
          year: 2016,
          name: "Spanish Grand Prix",
          label: "2016 Spanish GP: Verstappen's first win at age 18",
        },
        {
          year: 2018,
          name: "Monaco Grand Prix",
          label: "2018 Monaco GP: Ricciardo's redemption after 2016 heartache",
        },
        {
          year: 2019,
          name: "Austrian Grand Prix",
          label: "2019 Austrian GP: Verstappen's comeback win",
        },
        {
          year: 2021,
          name: "Monaco Grand Prix",
          label: "2021 Monaco GP: Verstappen's win set up his championship run",
        },
        {
          year: 2021,
          name: "Abu Dhabi Grand Prix",
          label: "2021 Abu Dhabi GP: Verstappen's dramatic title win",
        },
        {
          year: 2021,
          name: "Azerbaijan Grand Prix",
          label: "2021 Azerbaijan GP: Pérez's street fighting skills in Baku",
        },
      ];

      svgSignificantRaces
        .selectAll("circle")
        .data(significantRaces)
        .enter()
        .append("circle")
        .attr("cx", (d) => xScale(d.year))
        .attr("cy", (d) => yScale(d.points))
        .attr("r", (d) => {
          const isAnnotated = annotations.some(
            (ann) => ann.year === d.year && ann.name === d.name
          );
          return isAnnotated ? 8 : 5;
        })
        .attr("fill", (d) => {
          const isAnnotated = annotations.some(
            (ann) => ann.year === d.year && ann.name === d.name
          );
          return isAnnotated ? "orange" : "steelblue";
        })
        .on("mouseover", function (event, d) {
          tooltip.transition().duration(200).style("opacity", 0.9);

          const overlappingPoints = significantRaces.filter(
            (race) => race.year === d.year && race.points === d.points
          );

          const combinedAnnotations = annotations
            .filter((ann) =>
              overlappingPoints.some(
                (race) => ann.year === race.year && ann.name === race.name
              )
            )
            .map((ann) => ann.label)
            .join("<br>");

          const racesDetails = overlappingPoints
            .map(
              (race) =>
                `Race: ${race.name} ${race.year}<br>Points: ${race.points}`
            )
            .join("<br>");

          tooltip
            .html(
              `${racesDetails}` +
                (combinedAnnotations ? `<br>${combinedAnnotations}` : "")
            )
            .style("left", event.pageX + 5 + "px")
            .style("top", event.pageY - 28 + "px");
        })
        .on("mouseout", function () {
          tooltip.transition().duration(500).style("opacity", 0);
        })
        .on("click", function (event, d) {
          updateRaceDetails(d.raceId, d.name, d.year);
          d3.select("#race-dropdown").property("value", `${d.name} ${d.year}`);
          highlightDot(d.year, d.name);
        });

      function updateRaceDetails(raceId, raceName, raceYear) {
        const lapTimes = lapTimesData.filter((d) => d.raceId === raceId);
        const pitStops = pitStopsData.filter((d) => d.raceId === raceId);

        const lapTimeAvg =
          lapTimes.length > 0
            ? d3.mean(lapTimes, (d) => d.milliseconds / 1000)
            : 0;
        const pitStopAvg =
          pitStops.length > 0
            ? d3.mean(pitStops, (d) => d.milliseconds / 1000)
            : 0;

        d3.select("#race-details").html("");

        d3.select("#race-details")
          .append("h3")
          .text(`Details for ${raceName} ${raceYear}`);
        d3.select("#race-details")
          .append("p")
          .text(`Average Lap Time: ${lapTimeAvg.toFixed(2)} seconds`);
        d3.select("#race-details")
          .append("p")
          .text(`Average Pit Stop Time: ${pitStopAvg.toFixed(2)} seconds`);
      }

      function highlightDot(year, name) {
        svgSignificantRaces
          .selectAll("circle")
          .classed("highlighted-dot", false)
          .attr("fill", (d) => {
            const isAnnotated = annotations.some(
              (ann) => ann.year === d.year && ann.name === d.name
            );
            return isAnnotated ? "orange" : "steelblue";
          });

        svgSignificantRaces
          .selectAll("circle")
          .filter((d) => d.year === year && d.name === name)
          .classed("highlighted-dot", true)
          .attr("fill", "red");
      }

      const races = Array.from(
        new Set(significantRaces.map((d) => `${d.name} ${d.year}`))
      );
      d3.select("#race-dropdown")
        .selectAll("option")
        .data(races)
        .enter()
        .append("option")
        .text((d) => d);

      d3.select("#race-dropdown").on("change", function () {
        const selectedRace = d3.select(this).property("value");
        const selectedRaceData = significantRaces.find(
          (race) => `${race.name} ${race.year}` === selectedRace
        );
        updateRaceDetails(
          selectedRaceData.raceId,
          selectedRaceData.name,
          selectedRaceData.year
        );
        highlightDot(selectedRaceData.year, selectedRaceData.name);
      });

      if (significantRaces.length > 0) {
        const initialRace = significantRaces.find(
          (race) => race.name === "Brazilian Grand Prix" && race.year === 2013
        );
        updateRaceDetails(
          initialRace.raceId,
          initialRace.name,
          initialRace.year
        );
        highlightDot(initialRace.year, initialRace.name);
        d3.select("#race-dropdown").property(
          "value",
          `${initialRace.name} ${initialRace.year}`
        );
        svgSignificantRaces
          .selectAll("circle")
          .filter(
            (d) => d.year === initialRace.year && d.name === initialRace.name
          )
          .classed("highlighted-dot", true)
          .attr("fill", "red");
      } else {
        d3.select("#race-details")
          .append("p")
          .text("No significant races found for Red Bull.");
      }
    })
    .catch((error) => {
      console.error("Error loading or processing data:", error);
    });
}

function createScene3() {
  Promise.all([
    d3.csv("./data/circuits.csv"),
    d3.csv("./data/constructor_results.csv"),
    d3.csv("./data/races.csv"),
    d3.csv("./data/constructors.csv"),
  ]).then(
    ([circuitsData, constructorResultsData, racesData, constructorsData]) => {
      circuitsData.forEach((d) => {
        d.circuitId = +d.circuitId;
      });

      constructorResultsData.forEach((d) => {
        d.raceId = +d.raceId;
        d.constructorId = +d.constructorId;
        d.points = +d.points;
      });

      racesData.forEach((d) => {
        d.raceId = +d.raceId;
        d.circuitId = +d.circuitId;
        d.year = +d.year;
      });
      const filteredRacesData = racesData.filter(
        (d) => d.year >= 2005 && d.year <= 2021
      );

      const redBullResults = constructorResultsData.filter(
        (d) => d.constructorId === 9
      );

      const performanceData = redBullResults
        .map((result) => {
          const race = filteredRacesData.find(
            (r) => r.raceId === result.raceId
          );
          if (race) {
            const circuit = circuitsData.find(
              (c) => c.circuitId === race.circuitId
            );
            if (circuit) {
              return {
                circuit: circuit.name,
                points: result.points,
              };
            }
          }
        })
        .filter((d) => d !== undefined);

      const redBullPerformance = d3.rollup(
        performanceData,
        (v) => d3.mean(v, (d) => d.points),
        (d) => d.circuit
      );
      const redBullPerformanceData = Array.from(
        redBullPerformance,
        ([circuit, points]) => ({ circuit, points })
      );

      const margin = { top: 50, right: 30, bottom: 150, left: 75 };
      const width = 1000 - margin.left - margin.right;
      const height = 500 - margin.top - margin.bottom;

      const svgRedBull = d3
        .select("#redbull-performance-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      const xRedBull = d3
        .scaleBand()
        .domain(redBullPerformanceData.map((d) => d.circuit))
        .range([0, width])
        .padding(0.1);

      const yRedBull = d3
        .scaleLinear()
        .domain([0, d3.max(redBullPerformanceData, (d) => d.points)])
        .nice()
        .range([height, 0]);

      svgRedBull
        .append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xRedBull))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

      svgRedBull
        .append("g")
        .call(d3.axisLeft(yRedBull))
        .append("text")
        .attr("class", "axis-title")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 20)
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .text("Average Points");

      const tooltipRedBull = d3
        .select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

      svgRedBull
        .selectAll(".bar")
        .data(redBullPerformanceData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", (d) => xRedBull(d.circuit))
        .attr("y", (d) => yRedBull(d.points))
        .attr("width", xRedBull.bandwidth())
        .attr("height", (d) => height - yRedBull(d.points))
        .attr("fill", (d) => (d.points >= 15 ? "green" : "red"))
        .on("mouseover", function (event, d) {
          tooltipRedBull.transition().duration(200).style("opacity", 0.9);
          tooltipRedBull
            .html(
              `Circuit: ${d.circuit}<br>Average Points: ${d.points.toFixed(2)}`
            )
            .style("left", event.pageX + 5 + "px")
            .style("top", event.pageY - 28 + "px");
        })
        .on("mouseout", function () {
          tooltipRedBull.transition().duration(500).style("opacity", 0);
        });

      const annotations = [
        {
          note: {
            title: "5 wins",
            padding: 15,
          },
          x: xRedBull("Circuit de Monaco") + xRedBull.bandwidth() / 2,
          y: yRedBull(
            redBullPerformanceData.find(
              (d) => d.circuit === "Circuit de Monaco"
            ).points
          ),
          dy: -25,
          dx: 0,
        },
        {
          note: {
            title: "5 wins",
            padding: 15,
          },
          x: xRedBull("Yas Marina Circuit") + xRedBull.bandwidth() / 2,
          y: yRedBull(
            redBullPerformanceData.find(
              (d) => d.circuit === "Yas Marina Circuit"
            ).points
          ),
          dy: -30,
          dx: 0,
        },
        {
          note: {
            title: "3 wins",
            padding: 15,
          },
          x:
            xRedBull("Autódromo Hermanos Rodríguez") + xRedBull.bandwidth() / 2,
          y: yRedBull(
            redBullPerformanceData.find(
              (d) => d.circuit === "Autódromo Hermanos Rodríguez"
            ).points
          ),
          dy: -25,
          dx: 0,
        },
        {
          note: {
            title: "3 wins",
            padding: 15,
          },
          x: xRedBull("Marina Bay Street Circuit") + xRedBull.bandwidth() / 2,
          y: yRedBull(
            redBullPerformanceData.find(
              (d) => d.circuit === "Marina Bay Street Circuit"
            ).points
          ),
          dy: -25,
          dx: 0,
        },
        {
          note: {
            title:
              "Sebastian Vettel won all 3 races ever held here from 2011-2013",
            padding: 15,
          },
          x: xRedBull("Buddh International Circuit") + xRedBull.bandwidth() / 2,
          y: yRedBull(
            redBullPerformanceData.find(
              (d) => d.circuit === "Buddh International Circuit"
            ).points
          ),
          dy: -20,
          dx: 0,
        },
      ];

      const makeAnnotations = d3
        .annotation()
        .type(d3.annotationLabel)
        .annotations(annotations)
        .textWrap(200)
        .notePadding(15);

      svgRedBull
        .append("g")
        .attr("class", "annotation-group")
        .call(makeAnnotations);
    }
  );
}

function createScene4() {
  Promise.all([
    d3.csv("./data/drivers.csv"),
    d3.csv("./data/constructor_results.csv"),
    d3.csv("./data/results.csv"),
    d3.csv("./data/races.csv"),
  ]).then(([driversData, constructorResultsData, resultsData, racesData]) => {
    driversData.forEach((d) => {
      d.driverId = +d.driverId;
    });

    constructorResultsData.forEach((d) => {
      d.raceId = +d.raceId;
      d.constructorId = +d.constructorId;
    });

    resultsData.forEach((d) => {
      d.raceId = +d.raceId;
      d.driverId = +d.driverId;
      d.constructorId = +d.constructorId;
      d.points = +d.points;
    });

    racesData.forEach((d) => {
      d.raceId = +d.raceId;
      d.year = +d.year;
    });
    const filteredRacesData = racesData.filter(
      (d) => d.year >= 2005 && d.year <= 2021
    );

    const redBullDriverResults = resultsData.filter(
      (d) => d.constructorId === 9
    );

    const performanceData = redBullDriverResults
      .map((result) => {
        const race = filteredRacesData.find((r) => r.raceId === result.raceId);
        const driver = driversData.find((d) => d.driverId === result.driverId);
        if (race && driver) {
          return {
            driver: `${driver.forename} ${driver.surname}`,
            year: race.year,
            points: result.points,
          };
        }
      })
      .filter((d) => d !== undefined);

    const driverPerformance = d3.rollup(
      performanceData,
      (v) => d3.sum(v, (d) => d.points),
      (d) => d.driver,
      (d) => d.year
    );
    const driverPerformanceData = [];
    driverPerformance.forEach((years, driver) => {
      years.forEach((points, year) => {
        driverPerformanceData.push({ driver, year, points });
      });
    });

    const margin = { top: 75, right: 30, bottom: 80, left: 80 };
    const width = 1000 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svgDriverContributions = d3
      .select("#driver-contributions-chart")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xDriverContributions = d3
      .scaleBand()
      .domain(driverPerformanceData.map((d) => `${d.driver}-${d.year}`))
      .range([0, width])
      .padding(0.1);

    const yDriverContributions = d3
      .scaleLinear()
      .domain([0, d3.max(driverPerformanceData, (d) => d.points)])
      .nice()
      .range([height, 0]);

    const uniqueDrivers = Array.from(
      new Set(driverPerformanceData.map((d) => d.driver))
    );

    const colorScale = d3
      .scaleOrdinal(d3.schemeTableau10)
      .domain(uniqueDrivers);

    svgDriverContributions
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(
        d3.axisBottom(xDriverContributions).tickFormat((d) => d.split("-")[1])
      )
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    svgDriverContributions
      .append("g")
      .call(d3.axisLeft(yDriverContributions))
      .append("text")
      .attr("class", "axis-title")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -margin.left + 20)
      .attr("fill", "black")
      .style("text-anchor", "middle")
      .text("Total Points");

    const tooltipDriverContributions = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    svgDriverContributions
      .selectAll(".bar")
      .data(driverPerformanceData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => xDriverContributions(`${d.driver}-${d.year}`))
      .attr("y", (d) => yDriverContributions(d.points))
      .attr("width", xDriverContributions.bandwidth())
      .attr("height", (d) => height - yDriverContributions(d.points))
      .attr("fill", (d) => colorScale(d.driver))
      .on("mouseover", function (event, d) {
        tooltipDriverContributions
          .transition()
          .duration(200)
          .style("opacity", 0.9);
        tooltipDriverContributions
          .html(`Driver: ${d.driver}<br>Year: ${d.year}<br>Points: ${d.points}`)
          .style("left", event.pageX + 5 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", function () {
        tooltipDriverContributions
          .transition()
          .duration(500)
          .style("opacity", 0);
      });

    const annotations = [
      {
        note: {
          title: "Drivers' Champion (5 wins)",
          padding: 15,
        },
        data: driverPerformanceData.find(
          (d) => d.driver === "Sebastian Vettel" && d.year === 2010
        ),
        dx: -65,
        dy: -30,
      },
      {
        note: {
          title: "Drivers' Champion (11 wins)",
          padding: 15,
        },
        data: driverPerformanceData.find(
          (d) => d.driver === "Sebastian Vettel" && d.year === 2011
        ),
        dx: -40,
        dy: -15,
      },
      {
        note: {
          title: "Drivers' Champion (5 wins)",
          padding: 15,
        },
        data: driverPerformanceData.find(
          (d) => d.driver === "Sebastian Vettel" && d.year === 2012
        ),
        dx: 75,
        dy: -30,
      },
      {
        note: {
          title: "Drivers' Champion (13 wins)",
          padding: 15,
        },
        data: driverPerformanceData.find(
          (d) => d.driver === "Sebastian Vettel" && d.year === 2013
        ),
        dx: 0,
        dy: -35,
      },
      {
        note: {
          title: "Drivers' Champion (10 wins)",
          padding: 15,
        },
        data: driverPerformanceData.find(
          (d) => d.driver === "Max Verstappen" && d.year === 2021
        ),
        dx: 30,
        dy: -30,
      },
    ];
    annotations.forEach((annotation) => {
      if (!annotation.data) {
        console.warn("Annotation data not found:", annotation);
      } else {
        annotation.x =
          xDriverContributions(
            `${annotation.data.driver}-${annotation.data.year}`
          ) +
          xDriverContributions.bandwidth() / 2;
        annotation.y = yDriverContributions(annotation.data.points);
      }
    });

    const makeAnnotations = d3
      .annotation()
      .type(d3.annotationLabel)
      .accessors({
        x: (d) => d.x,
        y: (d) => d.y,
      })
      .annotations(annotations.filter((annotation) => annotation.data));

    svgDriverContributions
      .append("g")
      .attr("class", "annotation-group")
      .call(makeAnnotations);
  });
}

createScene1();
createScene2();
createScene3();
createScene4();
