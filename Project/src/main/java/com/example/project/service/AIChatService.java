package com.example.project.service;

import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.stereotype.Service;

import org.springframework.ai.chat.client.ChatClient;
import reactor.core.publisher.Flux;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;


@Service
public class AIChatService {

  private final ChatClient chatClient;
  private final ChatMemory chatMemory;

  private final SkillRepository skillRepository;
  private final CategoryRepository categoryRepository;

    private static String SYSTEM_INSTRUCTION= """
        אתה עוזר AI (AI Assistant) הממוקד בסיוע למשתמשים בענייני מיומנויות בלבד.
        .ענה בשפה ברורה ומדויקת, שתתאים הן למשתמשים חדשים והן למשתמשים מנוסים בתחום
        .אם יש כלי, שיטה, או טכנולוגיה חלופית למיומנות מסוימת, ציין את כל החלופות הרלוונטיות
        .אם מישהו שואל אותך על נושאים טכניים כלליים שאינם מיומנויות ספציפיות, כגון "מהי מהירות האור", ענה גם על כך
        .לשאלות שאינן קשורות לתחום המקצועי, הטכני או הניהולי, ענה בנימוס כי תפקידך הוא לסייע רק בענייני מיומנויות
        בנוסף, יש לך גישה לרשימת הפוסטים והקטגוריות הקיימים כרגע באתר (הם יצורפו להמשך ההודעה). אם משתמש שואל אם קיים תוכן מסוים, בדוק ברשימה המצורפת וענה לו בהתאם.
      """;
    public AIChatService(ChatClient.Builder chatClient , ChatMemory chatMemory , SkillRepository skillRepository, CategoryRepository categoryRepository) {
        this.chatClient = chatClient.build();
        this.chatMemory = chatMemory;
        this.skillRepository = skillRepository;
        this.categoryRepository = categoryRepository;
    }


    private String getDatabaseContext() {
        // שליפת כל שמות המיומנויות מה-DB (מומלץ להגביל ל-20 האחרונים כדי לא להעמיס על ה-Prompt)
        String skills = skillRepository.findAll().stream()
                .map(s -> s.getTitle()) // ודאי שזה השם של השדה אצלך (Title או Name)
                .collect(Collectors.joining(", "));

        String categories = categoryRepository.findAll().stream()
                .map(c -> c.getCategoryName())
                .collect(Collectors.joining(", "));

        return "\n--- REAL-TIME WEBSITE DATA ---\n" +
                "Available Skills/Posts: " + skills + "\n" +
                "Available Categories: " + categories + "\n" +
                "------------------------------";
    }


    public String getResponse(String prompt) {
        SystemMessage systemMessage = new SystemMessage(SYSTEM_INSTRUCTION);
        UserMessage userMessage= new UserMessage(prompt);

        List<Message> messageList= List.of(systemMessage, userMessage);

        return chatClient.prompt().messages(messageList).call().content();

    }


    public String getResponse2(String prompt, String conversationId) {
        try {

            String dynamicInstructions = SYSTEM_INSTRUCTION + getDatabaseContext();

            List<Message> messageList = new ArrayList<>();
            messageList.add(new SystemMessage(dynamicInstructions));

            if (chatMemory != null && conversationId != null) {
                messageList.addAll(chatMemory.get(conversationId));
            }

            messageList.add(new UserMessage(prompt));

            String aiResponse = chatClient.prompt().messages(messageList).call().content();

            if (chatMemory != null && conversationId != null) {
                chatMemory.add(conversationId, List.of(new UserMessage(prompt), new AssistantMessage(aiResponse)));
            }

            return aiResponse;

        } catch (Exception e) {
            return "Sorry, I'm having trouble connecting to my knowledge base.";
        }
    }


}


