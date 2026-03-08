import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { compassAPI } from "../../../services/api";

/**
 * useCompassCreate — manages the goal → clarify → generate flow.
 * On successful generation, navigates to the new compass detail page.
 */
export default function useCompassCreate() {
  const navigate = useNavigate();

  const [goalText, setGoalText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatingStep, setGeneratingStep] = useState(0);
  const [clarification, setClarification] = useState(null);
  const [clarifyLoading, setClarifyLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Generate (two-step: clarify → generate) ──
  const handleGenerate = useCallback(async () => {
    if (!goalText.trim() || goalText.trim().length < 5) return;

    // If no clarification answers pending, try clarify first
    if (!clarification) {
      try {
        setClarifyLoading(true);
        setError(null);
        const res = await compassAPI.clarify(goalText.trim());
        if (res.success && res.needsClarification && res.questions?.length > 0) {
          setClarification({
            questions: res.questions,
            reasoning: res.reasoning,
            goalAnalysis: res.goalAnalysis || null,
            parsedGoal: res._parsed || null,
            answers: res.questions.map(() => ""),
          });
          setClarifyLoading(false);
          return; // Show clarification UI
        }
        if (res.goalAnalysis) {
          setClarification((prev) =>
            prev ? { ...prev, goalAnalysis: res.goalAnalysis } : null
          );
        }
      } catch {
        // Clarification failed — proceed to generate
      } finally {
        setClarifyLoading(false);
      }
    }

    await doGenerate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalText, clarification]);

  const doGenerate = useCallback(
    async (answers = null) => {
      try {
        setGenerating(true);
        setError(null);
        setGeneratingStep(0);

        const stepTimer = setInterval(() => {
          setGeneratingStep((s) => Math.min(s + 1, 3));
        }, 1500);

        // Build clarification answers
        let clarificationAnswers = null;
        const answersSource = answers || clarification?.answers;
        if (clarification?.questions && answersSource) {
          clarificationAnswers = clarification.questions
            .map((q, i) => ({ question: q.question, answer: answersSource[i] }))
            .filter((qa) => qa.answer?.trim());
        }

        const res = await compassAPI.generate(
          goalText.trim(),
          clarificationAnswers?.length > 0 ? clarificationAnswers : null,
          clarification?.parsedGoal || null
        );
        clearInterval(stepTimer);

        if (res.success) {
          setGoalText("");
          setClarification(null);

          if (res.goalType === "multi" && Array.isArray(res.compasses)) {
            // Suite — navigate to first compass with suite context
            // For now navigate to list — suite preview will be handled there
            navigate("/app/compass", { state: { suite: { suiteId: res.suiteId, suiteName: res.suiteName, compasses: res.compasses } } });
          } else {
            // Single — navigate to its detail page
            navigate(`/app/compass/${res.compass._id}`);
          }
        } else {
          setError(res.error || "Generation failed");
        }
      } catch (err) {
        setError(err.message || "Generation failed. Please try again.");
      } finally {
        setGenerating(false);
        setGeneratingStep(0);
      }
    },
    [goalText, clarification, navigate]
  );

  const handleClarificationSubmit = useCallback(async () => {
    await doGenerate();
  }, [doGenerate]);

  const handleSkipClarification = useCallback(async () => {
    setClarification(null);
    await doGenerate([]);
  }, [doGenerate]);

  const updateClarificationAnswer = useCallback((index, value) => {
    setClarification((prev) => {
      if (!prev) return prev;
      const newAnswers = [...prev.answers];
      newAnswers[index] = value;
      return { ...prev, answers: newAnswers };
    });
  }, []);

  const goBack = useCallback(() => {
    setClarification(null);
    navigate("/app/compass");
  }, [navigate]);

  return {
    goalText,
    setGoalText,
    generating,
    generatingStep,
    clarification,
    clarifyLoading,
    error,
    setError,
    handleGenerate,
    handleClarificationSubmit,
    handleSkipClarification,
    updateClarificationAnswer,
    goBack,
  };
}
