import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function NHIEGame() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [isInfiniteMode, setIsInfiniteMode] = useState(false);
  const router = useRouter();

  const questions = [
    "Never have I ever... lied about my age",
    "Never have I ever... eaten something that fell on the floor",
    "Never have I ever... pretended to be sick to skip work/school",
    "Never have I ever... danced in public",
    "Never have I ever... sung in the shower",
    "Never have I ever... stayed up all night",
    "Never have I ever... eaten dessert for breakfast",
    "Never have I ever... talked to myself",
    "Never have I ever... laughed so hard I cried",
    "Never have I ever... made a prank call",
    "Never have I ever... worn clothes inside out",
    "Never have I ever... eaten ice cream in winter",
    "Never have I ever... forgotten someone's name",
    "Never have I ever... danced in the rain",
    "Never have I ever... eaten pizza for breakfast",
    "Never have I ever... watched a movie twice in one day",
    "Never have I ever... slept in my clothes",
    "Never have I ever... eaten something spicy and regretted it",
    "Never have I ever... laughed at my own joke",
    "Never have I ever... taken a selfie",
  ];

  const handleAnswer = (answered: boolean) => {
    if (answered) {
      setScore(score + 1);
    }
    
    if (isInfiniteMode) {
      // In infinite mode, cycle through questions indefinitely
      setCurrentQuestion((currentQuestion + 1) % questions.length);
    } else {
      // Normal mode - end game after all questions
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        // Game finished
        setCurrentQuestion(0);
      }
    }
  };

  const resetGame = () => {
    setCurrentQuestion(0);
    setScore(0);
  };

  const toggleInfiniteMode = () => {
    setIsInfiniteMode(!isInfiniteMode);
    resetGame();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🎮 Never Have I Ever</Text>
      
      {currentQuestion < questions.length ? (
        <View style={styles.gameContainer}>
          <Text style={styles.score}>Score: {score}</Text>
          <Text style={styles.questionNumber}>
            {isInfiniteMode 
              ? `Question ${currentQuestion + 1}` 
              : `Question ${currentQuestion + 1} of ${questions.length}`
            }
          </Text>
          
          <View style={styles.questionCard}>
            <Text style={styles.question}>{questions[currentQuestion]}</Text>
          </View>
          
          <View style={styles.buttonContainer}>
            <Pressable 
              style={[styles.button, styles.yesButton]} 
              onPress={() => handleAnswer(true)}
            >
              <Text style={styles.buttonText}>I HAVE! 😅</Text>
            </Pressable>
            
            <Pressable 
              style={[styles.button, styles.noButton]} 
              onPress={() => handleAnswer(false)}
            >
              <Text style={styles.buttonText}>I HAVEN'T! 😇</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>🎉 Game Complete! 🎉</Text>
          <Text style={styles.resultScore}>Your Score: {score}/{questions.length}</Text>
          <Text style={styles.resultMessage}>
            {score === 0 ? "You're such a good person! 😇" :
             score < 5 ? "You're pretty innocent! 😊" :
             score < 10 ? "You've had some fun! 😄" :
             score < 15 ? "You're quite adventurous! 😎" :
             "You're wild! 🔥"}
          </Text>
          
          <Pressable style={styles.playAgainButton} onPress={resetGame}>
            <Text style={styles.playAgainText}>Play Again</Text>
          </Pressable>
        </View>
      )}
      
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Back to Home</Text>
      </Pressable>

      {/* Infinite Mode Toggle Button */}
      <Pressable 
        style={[styles.infiniteButton, isInfiniteMode && styles.infiniteButtonActive]} 
        onPress={toggleInfiniteMode}
      >
        <Text style={styles.infiniteButtonText}>
          {isInfiniteMode ? "🔄 Go Back to Normal Mode" : "♾️ Infinite Mode"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
    color: "#333",
  },
  gameContainer: {
    flex: 1,
    alignItems: "center",
  },
  score: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007aff",
    marginBottom: 10,
  },
  questionNumber: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
  },
  questionCard: {
    backgroundColor: "#f8f9fa",
    padding: 25,
    borderRadius: 15,
    marginBottom: 40,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  question: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
    lineHeight: 30,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    gap: 15,
  },
  button: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  yesButton: {
    backgroundColor: "#FF6B6B",
  },
  noButton: {
    backgroundColor: "#4ECDC4",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  resultContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  resultScore: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007aff",
    marginBottom: 15,
  },
  resultMessage: {
    fontSize: 18,
    textAlign: "center",
    color: "#666",
    marginBottom: 30,
  },
  playAgainButton: {
    backgroundColor: "#007aff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 30,
  },
  playAgainText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  backButton: {
    backgroundColor: "#f0f0f0",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  infiniteButton: {
    backgroundColor: "#FFD700",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infiniteButtonActive: {
    backgroundColor: "#FFA500",
  },
  infiniteButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
}); 