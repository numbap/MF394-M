import apiClient from "./apiClient";

export const gameService = {
  async getGameContacts(tags = []) {
    try {
      const params = tags.length > 0 ? { tags: tags.join(",") } : {};
      const response = await apiClient.get("/api/game-contacts", { params });
      return response.data.contacts || [];
    } catch (error) {
      console.error("Error fetching game contacts:", error);
      throw error;
    }
  },

  async recordQuizScore(score, totalQuestions, tags = []) {
    try {
      const response = await apiClient.post("/api/quiz-score", {
        score,
        totalQuestions,
        tags,
        timestamp: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      console.error("Error recording quiz score:", error);
      throw error;
    }
  },

  async getStats() {
    try {
      const response = await apiClient.get("/api/stats");
      return response.data;
    } catch (error) {
      console.error("Error fetching stats:", error);
      throw error;
    }
  },
};
